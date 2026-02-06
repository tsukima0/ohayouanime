import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Settings,
} from "lucide-react";
import { formatTimestamp } from "@/lib/mock-data";
import { motion } from "framer-motion";

interface VideoPlayerProps {
  episodeTitle: string;
  animeName: string;
  duration: number; // total duration in seconds
}

export default function VideoPlayer({
  episodeTitle,
  animeName,
  duration,
}: VideoPlayerProps) {
  const [searchParams] = useSearchParams();
  const startTime = parseInt(searchParams.get("t") || "0", 10);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(!!searchParams.get("t"));
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const progressInterval = useRef<ReturnType<typeof setInterval>>();

  // Simulate playback
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, duration]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimer.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [showControls, isPlaying]);

  // Show timestamp indicator
  useEffect(() => {
    if (showTimestamp) {
      const timer = setTimeout(() => setShowTimestamp(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showTimestamp]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(fraction * duration));
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div
      className="cinema-player relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer"
      onClick={() => setShowControls(true)}
    >
      {/* Simulated Video Area (always dark/cinema) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,4%)] via-[hsl(0,0%,2%)] to-[hsl(0,0%,0%)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[hsl(0,0%,50%)] text-sm mb-2">{animeName}</p>
          <p className="text-[hsl(0,0%,80%)] text-xl font-display font-bold">{episodeTitle}</p>
          <p className="text-[hsl(0,0%,40%)] text-sm mt-2">
            {isPlaying ? "▶ Playing" : "⏸ Paused"} — {formatTimestamp(currentTime)}
          </p>
        </div>
      </div>

      {/* Jumped-to-timestamp indicator */}
      {showTimestamp && startTime > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium glow-primary">
            <SkipForward className="w-4 h-4" />
            <span>Jumped to {formatTimestamp(startTime)} from clip</span>
          </div>
        </motion.div>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%,0.8)] via-transparent to-[hsl(0,0%,0%,0.3)] z-10 transition-opacity"
      >
        {/* Center Play/Pause */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground hover:bg-primary transition-colors glow-primary"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </motion.button>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div
            className="w-full h-1.5 rounded-full bg-[hsl(0,0%,30%)] cursor-pointer mb-3 group/progress hover:h-2.5 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handleProgressClick(e);
            }}
          >
            <div
              className="h-full rounded-full bg-primary relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-primary-sm opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentTime(Math.max(0, currentTime - 10));
                }}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentTime(Math.min(duration, currentTime + 10));
                }}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs text-[hsl(0,0%,70%)] font-mono">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
