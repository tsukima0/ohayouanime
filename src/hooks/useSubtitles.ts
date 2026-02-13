import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Subtitle {
  id: string;
  episode_id: string;
  language: string;
  label: string;
  file_url: string;
  created_at: string;
}

export function useSubtitles(episodeId: string | undefined) {
  return useQuery({
    queryKey: ["subtitles", episodeId],
    queryFn: async () => {
      if (!episodeId) return [];
      const { data, error } = await supabase
        .from("subtitles_public" as any)
        .select("*")
        .eq("episode_id", episodeId)
        .order("label");
      if (error) throw error;
      return (data ?? []) as unknown as Subtitle[];
    },
    enabled: !!episodeId,
  });
}
