import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicSeries } from "@/hooks/useSeriesData";

export function usePopularSeries() {
  return useQuery({
    queryKey: ["popularSeries"],
    queryFn: async () => {
      // Get total views per series from episodes
      const { data: episodes, error: epError } = await supabase
        .from("episodes" as any)
        .select("series_id, view_count");
      if (epError) throw epError;

      // Sum views per series
      const viewsMap: Record<string, number> = {};
      (episodes as any[])?.forEach((ep) => {
        viewsMap[ep.series_id] = (viewsMap[ep.series_id] || 0) + (ep.view_count || 0);
      });

      // Get all public series
      const { data: series, error } = await supabase
        .from("series_public" as any)
        .select("*");
      if (error) throw error;

      // Sort by total views descending, take top 5
      const sorted = (series as unknown as PublicSeries[])
        .sort((a, b) => (viewsMap[b.id] || 0) - (viewsMap[a.id] || 0))
        .slice(0, 5);

      return sorted;
    },
  });
}
