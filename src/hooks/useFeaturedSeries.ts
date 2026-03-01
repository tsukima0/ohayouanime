import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicSeries } from "@/hooks/useSeriesData";

export function useFeaturedSeries() {
  return useQuery({
    queryKey: ["featuredSeries"],
    queryFn: async () => {
      // Get featured series IDs ordered by sort_order
      const { data: featured, error: fErr } = await supabase
        .from("featured_series")
        .select("series_id, sort_order")
        .order("sort_order", { ascending: true });
      if (fErr) throw fErr;
      if (!featured || featured.length === 0) return [];

      const ids = featured.map((f: any) => f.series_id);

      // Fetch the actual series data
      const { data: series, error } = await supabase
        .from("series_public" as any)
        .select("*")
        .in("id", ids);
      if (error) throw error;

      // Maintain sort order from featured_series
      const seriesMap = new Map((series as unknown as PublicSeries[]).map((s) => [s.id, s]));
      return ids.map((id: string) => seriesMap.get(id)).filter(Boolean) as PublicSeries[];
    },
  });
}
