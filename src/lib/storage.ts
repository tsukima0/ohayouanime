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
