import { History, Sparkles, Flame } from "lucide-react";
import { useNewEpisodes, useMostPopularEpisodes } from "@/hooks/useHomepageData";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { toEpisodeWithSeries, type PublicEpisode } from "@/hooks/useSeriesData";
import EpisodeScrollCard from "@/components/EpisodeScrollCard";
import HorizontalScrollSection from "@/components/HorizontalScrollSection";
import { useAuth } from "@/hooks/useAuth";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";

function useContinueWatchingEpisodes(episodeIds: string[]) {
  return useQueries({
    queries: episodeIds.map((id) => ({
      queryKey: ["episode", id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("episodes_public" as any)
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return toEpisodeWithSeries(data as unknown as PublicEpisode);
      },
      enabled: !!id,
      staleTime: 60_000,
    })),
  });
}

export default function BrowsePage() {
  const { user } = useAuth();
  const { data: newEpisodes, isLoading: newLoading } = useNewEpisodes();
  const { data: popularEpisodes, isLoading: popularLoading } = useMostPopularEpisodes();
  const { data: watchHistory } = useWatchHistory();

  const continueIds = (watchHistory ?? []).map((h) => h.episode_id);
  const continueEpisodeResults = useContinueWatchingEpisodes(continueIds);
  const continueWatchingItems = continueIds
    .map((id, i) => {
      const ep = continueEpisodeResults[i]?.data;
      const hist = watchHistory?.find((h) => h.episode_id === id);
      if (!ep || !hist) return null;
      const progress = hist.duration > 0 ? (hist.watched_seconds / hist.duration) * 100 : 0;
      return { ep, progress, watched_seconds: hist.watched_seconds };
    })
    .filter(Boolean) as { ep: ReturnType<typeof toEpisodeWithSeries>; progress: number; watched_seconds: number }[];

  const isLoading = newLoading || popularLoading;

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Watch</h1>
        <p className="text-muted-foreground text-sm mb-8">Your personalized episode feed</p>
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="flex-shrink-0 w-52 sm:w-60 aspect-video rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Continue Watching */}
          {user && continueWatchingItems.length > 0 && (
            <HorizontalScrollSection
              title="Continue Watching"
              icon={<History className="w-5 h-5 text-primary" />}
            >
              {continueWatchingItems.map(({ ep, progress }) => (
                <div key={ep.id} style={{ scrollSnapAlign: "start" }}>
                  <EpisodeScrollCard
                    id={ep.id}
                    title={ep.title}
                    episode_number={ep.episode_number}
                    season={ep.season}
                    duration={ep.duration}
                    thumbnail_url={ep.thumbnail_url}
                    video_url={ep.video_url}
                    series={ep.series}
                    progress={progress}
                  />
                </div>
              ))}
            </HorizontalScrollSection>
          )}

          {/* New Episodes */}
          {newEpisodes && newEpisodes.length > 0 && (
            <HorizontalScrollSection
              title="New Episodes"
              icon={<Sparkles className="w-5 h-5 text-primary" />}
            >
              {newEpisodes.map((ep) => (
                <div key={ep.id} style={{ scrollSnapAlign: "start" }}>
                  <EpisodeScrollCard
                    id={ep.id}
                    title={ep.title}
                    episode_number={ep.episode_number}
                    season={ep.season}
                    duration={ep.duration}
                    thumbnail_url={ep.thumbnail_url}
                    video_url={ep.video_url}
                    series={ep.series}
                  />
                </div>
              ))}
            </HorizontalScrollSection>
          )}

          {/* Most Popular */}
          {popularEpisodes && popularEpisodes.length > 0 && (
            <HorizontalScrollSection
              title="Most Popular"
              icon={<Flame className="w-5 h-5 text-primary" />}
            >
              {popularEpisodes.map((ep) => (
                <div key={ep.id} style={{ scrollSnapAlign: "start" }}>
                  <EpisodeScrollCard
                    id={ep.id}
                    title={ep.title}
                    episode_number={ep.episode_number}
                    season={ep.season}
                    duration={ep.duration}
                    thumbnail_url={ep.thumbnail_url}
                    video_url={ep.video_url}
                    series={ep.series}
                  />
                </div>
              ))}
            </HorizontalScrollSection>
          )}

          {/* Empty state */}
          {(!newEpisodes || newEpisodes.length === 0) &&
            (!popularEpisodes || popularEpisodes.length === 0) &&
            continueWatchingItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold mb-2">Nothing here yet</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Start watching episodes and they'll appear here. New episodes are added weekly!
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
