import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import type { ShortWithEpisode } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useShortLike } from "@/hooks/useShortInteractions";
import { useNavigate } from "react-router-dom";
import ShortActions from "@/components/shorts/ShortActions";
import ShortCommentsSheet from "@/components/shorts/ShortCommentsSheet";
import ShortShareSheet from "@/components/shorts/ShortShareSheet";
import ShortProgressBar from "@/components/shorts/ShortProgressBar";

interface ShortCardProps {
  short: ShortWithEpisode;
  isActive: boolean;
  shouldLoad: boolean;
}

export default function ShortCard({ short, isActive, shouldLoad }: ShortCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const [videoError, setVideoError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);

  const { liked, likesCount, toggleLike } = useShortLike(short.id);

  const hasVideo = !!short.video_url && !videoError;
  const renderVideo = hasVideo && shouldLoad;

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !renderVideo) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, renderVideo]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) toggleLike();
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) togglePlayPause();
      }, 300);
    }
  }, [togglePlayPause, liked, toggleLike]);

  const posterUrl = short.thumbnail_url || undefined;

  return (
    <div className="relative w-full h-full snap-start snap-always flex-shrink-0 overflow-hidden bg-background">
      {/* Video / Thumbnail background */}
      <div className="absolute inset-0 cursor-pointer" onClick={renderVideo ? handleTap : undefined}>
        {renderVideo ? (
          <video
            ref={videoRef}
            src={short.video_url!}
            poster={posterUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onError={() => { setVideoError(true); setIsPlaying(false); }}
          />
        ) : short.thumbnail_url ? (
          <img src={short.thumbnail_url} alt={short.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20 pointer-events-none" />
      </div>

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="hsl(var(--primary))" className="drop-shadow-lg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play/pause button */}
      {renderVideo && isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: isPlaying ? 0 : 1 }}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-foreground fill-current" />
          ) : (
            <Play className="w-7 h-7 text-foreground fill-current ml-0.5" />
          )}
        </button>
      )}

      {/* Content overlay */}
      <div className="relative h-full flex flex-col justify-end pb-4 sm:pb-6 pointer-events-none">
        {/* Right-side actions */}
        <div className="absolute right-3 bottom-28 sm:bottom-20 z-20 pointer-events-auto">
          <ShortActions
            liked={liked}
            likesCount={likesCount}
            commentsCount={(short as any).comments_count ?? 0}
            isMuted={isMuted}
            onToggleLike={toggleLike}
            onCommentOpen={() => setCommentsOpen(true)}
            onShareOpen={() => setShareOpen(true)}
            onToggleMute={() => setIsMuted((p) => !p)}
          />
        </div>

        {/* Bottom info */}
        <div className="max-w-[75%] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground leading-tight mb-1 drop-shadow-md">
              {short.title}
            </h2>
            {short.description && (
              <p className="text-xs text-foreground/70 mb-2 line-clamp-2 drop-shadow-sm">
                {short.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-foreground/60 mb-3">
              <span>{formatTimestamp(short.duration)}</span>
            </div>

            {/* Watch Full Episode button */}
            {short.episode_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/watch/${short.episode_id}`);
                }}
                className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-primary bg-primary/10 backdrop-blur-sm text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  Watch Full Episode
                  {short.episode && (
                    <span className="text-xs font-normal text-primary/70 ml-1">
                      — {short.episode.series?.title}
                    </span>
                  )}
                </span>
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sheets */}
      <ShortCommentsSheet open={commentsOpen} onOpenChange={setCommentsOpen} shortId={short.id} />
      <ShortShareSheet open={shareOpen} onOpenChange={setShareOpen} title={short.title} />
    </div>
  );
}