import { useParams } from "react-router-dom";
import { useEpisodeById, useNextEpisode, type EpisodeWithSeries } from "@/hooks/useSeriesData";
import { useSubtitles } from "@/hooks/useSubtitles";
import { useUpsertWatchHistory } from "@/hooks/useWatchHistory";
import { useAuth } from "@/hooks/useAuth";
import OhayouVideoPlayer from "@/components/video-player/OhayouVideoPlayer";
import NextEpisodeCard from "@/components/NextEpisodeCard";
import AdBanner from "@/components/AdBanner";
import { Clock, Calendar, Download } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function WatchPage() {
  const { episodeId } = useParams();
  const { data: episode, isLoading } = useEpisodeById(episodeId);
  const { data: nextEpisode } = useNextEpisode(episode);
  const { data: subtitles = [] } = useSubtitles(episodeId);
  const { user } = useAuth();
  const { mutate: upsertHistory } = useUpsertWatchHistory();

  // Save progress periodically (every 10s) using a ref to avoid re-creating the player
  const saveProgressRef = useRef<(currentTime: number, duration: number) => void>(() => {});

  // Increment view count once per episode load
  useEffect(() => {
    if (!episodeId) return;
    supabase.rpc("increment_episode_view_count" as any, { episode_id: episodeId }).then(() => {});
  }, [episodeId]);

  useEffect(() => {
    saveProgressRef.current = (currentTime: number, duration: number) => {
      if (!user || !episodeId || duration <= 0) return;
      upsertHistory({ episodeId, watchedSeconds: Math.floor(currentTime), duration: Math.floor(duration) });
    };
  }, [user, episodeId, upsertHistory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <div className="mt-6 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">Episode not found.</p>
      </div>
    );
  }

  const animeName = episode.series?.title || "Unknown Series";

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Player */}
        <motion.div
          key={episode.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <OhayouVideoPlayer
            episodeTitle={episode.title}
            animeName={animeName}
            duration={episode.duration}
            videoUrl={episode.video_url}
            nextEpisodeId={nextEpisode?.id}
            poster={episode.thumbnail_url || episode.series?.image_url}
            subtitleTracks={subtitles}
            onTimeUpdate={saveProgressRef}
          />
        </motion.div>

        {/* Episode Info */}
        <div className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary mb-1">{animeName}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Episode {episode.episode_number}: {episode.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(episode.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Season {episode.season}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mt-4 max-w-3xl leading-relaxed">
            {episode.description}
          </p>

          {/* Download Button */}
          {episode.video_url && (
            <div className="flex justify-end mt-4">
              <button
                onClick={async () => {
                  if (isDownloading) return;
                  setIsDownloading(true);
                  try {
                    const res = await fetch(episode.video_url!);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${animeName} - S${episode.season}E${episode.episode_number} - ${episode.title}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    console.error("Download failed");
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-60"
              >
                <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
                <span>{isDownloading ? "Downloading..." : "Download Episode"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Next Episode Card */}
        {nextEpisode && (
          <div className="mt-8">
            <NextEpisodeCard episode={nextEpisode} />
          </div>
        )}

        {/* Ad Banner */}
        <div className="mt-8">
          <AdBanner placement="banner" />
        </div>
      </div>
    </div>
  );
}
