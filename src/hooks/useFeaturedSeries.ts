import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicSeries } from "@/hooks/useSeriesData";

export interface FeaturedSeriesItem extends PublicSeries {
  banner_image_url?: string | null;
}

export function useFeaturedSeries() {
  return useQuery({
    queryKey: ["featuredSeries"],
    queryFn: async () => {
      const { data: featured, error: fErr } = await supabase
        .from("featured_series")
        .select("series_id, sort_order, banner_image_url")
        .order("sort_order", { ascending: true });
      if (fErr) throw fErr;
      if (!featured || featured.length === 0) return [];

      const ids = featured.map((f: any) => f.series_id);

      const { data: series, error } = await supabase
        .from("series_public" as any)
        .select("*")
        .in("id", ids);
      if (error) throw error;

      const seriesMap = new Map((series as unknown as PublicSeries[]).map((s) => [s.id, s]));
      const bannerMap = new Map((featured as any[]).map((f) => [f.series_id, f.banner_image_url]));

      return ids
        .map((id: string) => {
          const s = seriesMap.get(id);
          if (!s) return null;
          return { ...s, banner_image_url: bannerMap.get(id) || null } as FeaturedSeriesItem;
        })
        .filter(Boolean) as FeaturedSeriesItem[];
    },
  });
}
