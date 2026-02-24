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
  // Step 1: Get a presigned PUT URL from the edge function
  const { data: refreshed } = await supabase.auth.refreshSession();
  const { data: { session } } = await supabase.auth.getSession();
  const token = refreshed?.session?.access_token || session?.access_token;

  const presignRes = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-presign`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "video/mp4",
        folder,
      }),
    }
  );

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: "Failed to get upload URL" }));
    throw new Error(err.error || `Failed to get upload URL (${presignRes.status})`);
  }

  const { presignedUrl, publicUrl, contentType } = await presignRes.json();

  // Step 2: Upload directly to R2 using the presigned URL
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = 0; // No timeout for large files

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl);
      } else {
        console.error("R2 direct upload error:", xhr.status, xhr.responseText);
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
