import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(
  bucket: "videos" | "thumbnails" | "subtitles",
  file: File,
  path?: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = path || `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload a video file to Cloudflare R2 via the r2-upload edge function.
 * Returns the public URL for streaming.
 */
export async function uploadVideoToR2(
  file: File,
  folder: string = "episodes",
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;

  // Refresh session to ensure token is valid for long uploads
  const { data: refreshed } = await supabase.auth.refreshSession();
  const token = refreshed?.session?.access_token || session?.access_token;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.timeout = 0; // No timeout for large file uploads

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch {
          reject(new Error("Invalid response from upload"));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err.error || err.message || msg;
        } catch {
          msg = xhr.responseText || msg;
        }
        console.error("R2 upload error:", xhr.status, xhr.responseText);
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out — file may be too large"));
    xhr.send(formData);
  });
}
