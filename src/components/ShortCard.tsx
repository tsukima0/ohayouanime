import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { DbShort } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ShortActions from "@/components/shorts/ShortActions";
import ShortCommentsSheet from "@/components/shorts/ShortCommentsSheet";
import ShortShareSheet from "@/components/shorts/ShortShareSheet";
import ShortProgressBar from "@/components/shorts/ShortProgressBar";

interface ShortCardProps {
  short: DbShort;
  isActive: boolean;
  shouldLoad: boolean;
}

export default function ShortCard({ short, isActive, shouldLoad }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);

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

    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — show heart animation
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap — toggle play/pause after delay
      setTimeout(() => {
        if (lastTapRef.current !== 0) togglePlayPause();
      }, 300);
    }
  }, [togglePlayPause]);

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
        {/* Gradient overlays */}
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

      {/* Play/Pause flash */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Play className="w-7 h-7 text-foreground fill-current ml-0.5" />
              ) : (
                <Pause className="w-7 h-7 text-foreground fill-current" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute toggle — top right */}
      {renderVideo && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsMuted((p) => !p); }}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
        </button>
      )}

      {/* Content overlay */}
      <div className="relative h-full flex flex-col justify-end pb-4 sm:pb-6">
        {/* Right-side actions */}
        <div className="absolute right-3 bottom-28 sm:bottom-20 z-20">
          <ShortActions
            onCommentOpen={() => setCommentsOpen(true)}
            onShareOpen={() => setShareOpen(true)}
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
            <div className="flex items-center gap-3 text-xs text-foreground/60">
              <span>{formatTimestamp(short.duration)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress bar */}
      {renderVideo && <ShortProgressBar videoRef={videoRef} isActive={isActive} />}

      {/* Paused overlay */}
      {renderVideo && isActive && !isPlaying && !showPlayIcon && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-7 h-7 text-foreground fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Sheets */}
      <ShortCommentsSheet open={commentsOpen} onOpenChange={setCommentsOpen} />
      <ShortShareSheet open={shareOpen} onOpenChange={setShareOpen} title={short.title} />
    </div>
  );
}
