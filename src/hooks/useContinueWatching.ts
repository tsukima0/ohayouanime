import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toEpisodeWithSeries, PublicEpisode } from "@/hooks/useSeriesData";

export interface ContinueWatchingItem {
  episodeId: string;
  seriesId: string;
  seriesTitle: string;
  seriesImage: string | null;
  episodeNumber: number;
  episodeTitle: string;
  thumbnailUrl: string | null;
  progress: number;
  duration: number;
  watchedSeconds: number;
}

export function useContinueWatching() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["continueWatching", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get incomplete watch history
      const { data: history, error: histError } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .gt("watched_seconds", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (histError) throw histError;
      if (!history || history.length === 0) return [];

      // Fetch episode details
      const episodeIds = history.map((h) => h.episode_id);
      const { data: episodes, error: epError } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .in("id", episodeIds);
      if (epError) throw epError;

      const epMap = new Map(
        (episodes as unknown as PublicEpisode[]).map((ep) => [ep.id, ep])
      );

      return history
        .map((h) => {
          const ep = epMap.get(h.episode_id);
          if (!ep) return null;
          const progress = h.duration > 0 ? (h.watched_seconds / h.duration) * 100 : 0;
          return {
            episodeId: ep.id,
            seriesId: ep.series_id,
            seriesTitle: ep.series_title || "Unknown",
            seriesImage: ep.series_image_url,
            episodeNumber: ep.episode_number,
            episodeTitle: ep.title,
            thumbnailUrl: ep.thumbnail_url,
            progress,
            duration: h.duration,
            watchedSeconds: h.watched_seconds,
          } as ContinueWatchingItem;
        })
        .filter(Boolean) as ContinueWatchingItem[];
    },
    enabled: !!user,
  });
}
