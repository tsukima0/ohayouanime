import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Heart, Share2, MessageCircle, Volume2, VolumeX } from "lucide-react";
import type { DbShort } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";
import VideoThumbnail from "@/components/VideoThumbnail";

interface ShortCardProps {
  short: DbShort;
  isActive: boolean;
}

export default function ShortCard({ short, isActive }: ShortCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const hasVideo = !!short.video_url && !videoError;

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, hasVideo]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    // Flash the play/pause icon briefly
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-full snap-start snap-always flex-shrink-0">
      {/* Background - Video or Thumbnail */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={hasVideo ? togglePlayPause : undefined}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            src={short.video_url!}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onError={handleVideoError}
          />
        ) : short.thumbnail_url ? (
          <img
            src={short.thumbnail_url}
            alt={short.title}
            className="w-full h-full object-cover"
          />
        ) : short.video_url ? (
          <VideoThumbnail
            videoUrl={short.video_url}
            alt={short.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Play/Pause Flash Icon */}
      {showPlayIcon && (
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-background/60 flex items-center justify-center">
            {isPlaying ? (
              <Play className="w-7 h-7 text-foreground fill-current ml-0.5" />
            ) : (
              <Pause className="w-7 h-7 text-foreground fill-current" />
            )}
          </div>
        </motion.div>
      )}

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-4 pb-20 sm:pb-6">
        {/* Side Actions */}
        <div className="absolute right-4 bottom-32 sm:bottom-24 flex flex-col items-center gap-5">
          {/* Mute / Unmute */}
          {hasVideo && (
            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-foreground" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>
          )}

          <motion.button
            whileTap={{ scale: 1.3 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Heart className="w-5 h-5 text-foreground" />
            </div>
          </motion.button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Chat</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Share</span>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="max-w-[75%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground leading-tight mb-2">
              {short.title}
            </h2>
            {short.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {short.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span>{formatTimestamp(short.duration)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Paused overlay when video is paused and active */}
      {hasVideo && isActive && !isPlaying && !showPlayIcon && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center">
            <Play className="w-7 h-7 text-foreground fill-current ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
