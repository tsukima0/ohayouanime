import { supabase } from "@/integrations/supabase/client";

const R2_PUBLIC_BASE = "https://pub-4e3d2a977f8845e7b4585a44ad906f66.r2.dev/";

/**
 * Upload any file (image, subtitle, etc.) to Cloudflare R2 via presigned URL.
 * The `bucket` param is now used as the folder prefix in R2.
 */
export async function uploadFile(
  bucket: "videos" | "thumbnails" | "subtitles",
  file: File,
  path?: string
): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const folder = path ? path.split("/").slice(0, -1).join("/") || bucket : bucket;
  const fileName = path ? path.split("/").pop()! : `${crypto.randomUUID()}.${ext}`;

  return uploadToR2(file, folder, fileName);
}

/**
 * Upload a video file to Cloudflare R2 via presigned URL with progress tracking.
 */
export async function uploadVideoToR2(
  file: File,
  folder: string = "episodes",
  onProgress?: (percent: number) => void
): Promise<string> {
  const { presignedUrl, publicUrl, contentType } = await getPresignedUrl(file, folder);

  // Use fetch instead of XHR to avoid CORS preflight issues with R2
  if (onProgress) onProgress(10); // Signal upload started

  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  if (onProgress) onProgress(100);
  return publicUrl;
}

/**
 * Delete a file from R2 by its public URL.
 */
export async function deleteR2File(publicUrl: string): Promise<void> {
  if (!publicUrl || !publicUrl.includes("r2.dev/")) return;

  const key = publicUrl.split("r2.dev/")[1];
  if (!key) return;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-delete`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Delete failed" }));
    console.error("R2 delete error:", err);
  }
}

/**
 * Delete multiple R2 files. Silently skips non-R2 URLs.
 */
export async function deleteR2Files(urls: (string | null | undefined)[]): Promise<void> {
  const validUrls = urls.filter((u): u is string => !!u && u.includes("r2.dev/"));
  await Promise.allSettled(validUrls.map(deleteR2File));
}

// --- Internal helpers ---

async function getPresignedUrl(file: File, folder: string) {
  const { data: refreshed } = await supabase.auth.refreshSession();
  const { data: { session } } = await supabase.auth.getSession();
  const token = refreshed?.session?.access_token || session?.access_token;

  const res = await fetch(
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
        contentType: file.type || "application/octet-stream",
        folder,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to get upload URL" }));
    throw new Error(err.error || `Failed to get upload URL (${res.status})`);
  }

  return res.json();
}

async function uploadToR2(file: File, folder: string, _fileName: string): Promise<string> {
  const { presignedUrl, publicUrl, contentType } = await getPresignedUrl(file, folder);

  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  return publicUrl;
}
