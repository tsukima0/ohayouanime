import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toEpisodeWithSeries, PublicEpisode } from "@/hooks/useSeriesData";

// Helper re-exported for internal reuse
export { toEpisodeWithSeries };

// New episodes: latest episode per series (all time)
export function useNewEpisodes() {
  return useQuery({
    queryKey: ["newEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data) return [];

      // Keep only the latest episode per series
      const seen = new Set<string>();
      const result: ReturnType<typeof toEpisodeWithSeries>[] = [];
      for (const ep of data as unknown as PublicEpisode[]) {
        if (ep.series_id && !seen.has(ep.series_id)) {
          seen.add(ep.series_id);
          result.push(toEpisodeWithSeries(ep));
        }
      }
      return result;
    },
  });
}

// Most popular: top 5 episodes by view_count
export function useMostPopularEpisodes() {
  return useQuery({
    queryKey: ["mostPopularEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes" as any)
        .select("id, title, description, episode_number, season, duration, thumbnail_url, video_url, series_id, created_at, updated_at, view_count")
        .order("view_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!data) return [];
      // Fetch series info for each episode
      const seriesIds = [...new Set((data as any[]).map((e: any) => e.series_id))];
      const { data: seriesData } = await supabase
        .from("series_public" as any)
        .select("id, title, image_url")
        .in("id", seriesIds);
      const seriesMap = new Map((seriesData as any[] ?? []).map((s: any) => [s.id, s]));
      return (data as any[]).map((ep: any) => {
        const s = seriesMap.get(ep.series_id);
        return {
          id: ep.id ?? "",
          title: ep.title ?? "",
          description: ep.description ?? null,
          episode_number: ep.episode_number ?? 0,
          season: ep.season ?? 1,
          duration: ep.duration ?? 0,
          thumbnail_url: ep.thumbnail_url ?? null,
          video_url: ep.video_url ?? null,
          series_id: ep.series_id ?? null,
          series: s ? { title: s.title ?? "", image_url: s.image_url ?? null } : null,
        };
      });
    },
  });
}
