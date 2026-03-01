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

// 10 MB chunk size for multipart upload
const CHUNK_SIZE = 10 * 1024 * 1024;
// Max parallel part uploads
const MAX_PARALLEL = 3;

/**
 * Upload a video file to Cloudflare R2 using multipart upload with real progress tracking.
 * Falls back to single-part upload for files smaller than CHUNK_SIZE.
 */
export async function uploadVideoToR2(
  file: File,
  folder: string = "episodes",
  onProgress?: (percent: number) => void
): Promise<string> {
  // Small files: use simple presigned upload
  if (file.size < CHUNK_SIZE) {
    const { presignedUrl, publicUrl, contentType } = await getPresignedUrl(file, folder);
    if (onProgress) onProgress(10);
    const res = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    if (onProgress) onProgress(100);
    return publicUrl;
  }

  // Large files: multipart upload
  const token = await getAuthToken();
  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-multipart`;
  const headers = {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  };

  // 1. Initiate multipart upload
  const initRes = await fetch(fnUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "create",
      fileName: file.name,
      contentType: file.type || "video/mp4",
      folder,
    }),
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ error: "Failed to initiate upload" }));
    throw new Error(err.error || "Failed to initiate multipart upload");
  }
  const { uploadId, key, publicUrl, contentType } = await initRes.json();

  // 2. Split file into chunks and upload parts
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const completedParts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = 0;

  if (onProgress) onProgress(1);

  // Upload parts with concurrency limit
  const partQueue = Array.from({ length: totalParts }, (_, i) => i + 1);

  async function uploadPart(partNumber: number): Promise<void> {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // Get presigned URL for this part
    const presignRes = await fetch(fnUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "presign-part",
        key,
        uploadId,
        partNumber,
        contentType: contentType || "application/octet-stream",
      }),
    });
    if (!presignRes.ok) throw new Error(`Failed to presign part ${partNumber}`);
    const { presignedUrl, contentType: partCt } = await presignRes.json();

    // Upload the chunk
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": partCt },
      body: chunk,
    });
    if (!uploadRes.ok) throw new Error(`Part ${partNumber} upload failed (${uploadRes.status})`);

    const etag = uploadRes.headers.get("ETag") || `"part-${partNumber}"`;
    completedParts.push({ partNumber, etag });

    uploadedBytes += (end - start);
    if (onProgress) {
      // Reserve 1% for init, 4% for completion
      const pct = Math.round(1 + (uploadedBytes / file.size) * 95);
      onProgress(Math.min(pct, 96));
    }
  }

  // Process parts with concurrency limit
  let i = 0;
  while (i < partQueue.length) {
    const batch = partQueue.slice(i, i + MAX_PARALLEL);
    try {
      await Promise.all(batch.map(uploadPart));
    } catch (err) {
      // Abort multipart upload on failure
      await fetch(fnUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "abort", key, uploadId }),
      }).catch(() => {});
      throw err;
    }
    i += MAX_PARALLEL;
  }

  // 3. Complete multipart upload
  if (onProgress) onProgress(97);
  const completeRes = await fetch(fnUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "complete",
      key,
      uploadId,
      parts: completedParts,
    }),
  });
  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({ error: "Complete failed" }));
    throw new Error(err.error || "Failed to complete multipart upload");
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

async function getAuthToken(): Promise<string> {
  const { data: refreshed } = await supabase.auth.refreshSession();
  const { data: { session } } = await supabase.auth.getSession();
  return refreshed?.session?.access_token || session?.access_token || "";
}

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
