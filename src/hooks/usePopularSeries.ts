import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicSeries } from "@/hooks/useSeriesData";

export function usePopularSeries() {
  return useQuery({
    queryKey: ["popularSeries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_public" as any)
        .select("*")
        .order("rating", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as unknown as PublicSeries[];
    },
  });
}
