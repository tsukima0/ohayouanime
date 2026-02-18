import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toEpisodeWithSeries, PublicEpisode } from "@/hooks/useSeriesData";

// Helper re-exported for internal reuse
export { toEpisodeWithSeries };

// New episodes: latest episode per series released in the last 7 days
export function useNewEpisodes() {
  return useQuery({
    queryKey: ["newEpisodes"],
    queryFn: async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .gte("created_at", oneWeekAgo)
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

// Most popular: top 5 episodes by views (we'll use most recently updated as proxy for now)
// In a real app you'd track views; here we return the 5 most recent episodes overall
export function useMostPopularEpisodes() {
  return useQuery({
    queryKey: ["mostPopularEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as unknown as PublicEpisode[]).map(toEpisodeWithSeries);
    },
  });
}
