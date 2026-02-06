import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlistIds(new Set());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("series_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setWatchlistIds(new Set(data.map((row) => row.series_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const toggleWatchlist = async (seriesId: string) => {
    if (!user) return false;

    if (watchlistIds.has(seriesId)) {
      // Remove
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("series_id", seriesId);

      if (!error) {
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(seriesId);
          return next;
        });
      }
      return !error;
    } else {
      // Add
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, series_id: seriesId });

      if (!error) {
        setWatchlistIds((prev) => new Set(prev).add(seriesId));
      }
      return !error;
    }
  };

  const isInWatchlist = (seriesId: string) => watchlistIds.has(seriesId);

  return { watchlistIds, loading, toggleWatchlist, isInWatchlist };
}
