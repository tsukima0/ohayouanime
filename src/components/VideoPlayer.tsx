import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Check,
} from "lucide-react";
import { formatTimestamp } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
  episodeTitle: string;
  animeName: string;
  duration: number;
}

const QUALITY_OPTIONS = ["1080p", "720p", "480p", "360p"] as const;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export default function VideoPlayer({
  episodeTitle,
  animeName,
  duration,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState<typeof QUALITY_OPTIONS[number]>("1080p");
  const [speed, setSpeed] = useState<number>(1);

  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const progressInterval = useRef<ReturnType<typeof setInterval>>();
  const playerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

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
      }, 1000 / speed);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, duration, speed]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimer.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
        }
      }, 3000);
    }
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [showControls, isPlaying]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    setCurrentTime(Math.floor(fraction * duration));
  };

  const skipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTime(Math.max(0, currentTime - 10));
  };

  const skipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTime(Math.min(duration, currentTime + 10));
  };

  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen not supported:", err);
    }
  }, []);

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings((prev) => !prev);
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div
      ref={playerRef}
      className="cinema-player relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer"
      onClick={() => {
        setShowControls(true);
        setShowSettings(false);
      }}
    >
      {/* Simulated Video Area */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,4%)] via-[hsl(0,0%,2%)] to-[hsl(0,0%,0%)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[hsl(0,0%,50%)] text-sm mb-2">{animeName}</p>
          <p className="text-[hsl(0,0%,80%)] text-xl font-display font-bold">{episodeTitle}</p>
          <p className="text-[hsl(0,0%,40%)] text-sm mt-2">
            {isPlaying ? "▶ Playing" : "⏸ Paused"} — {formatTimestamp(currentTime)}
          </p>
          <p className="text-[hsl(0,0%,30%)] text-xs mt-1">
            {quality} • {speed}x
          </p>
        </div>
      </div>

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%,0.8)] via-transparent to-[hsl(0,0%,0%,0.3)] z-10 transition-opacity"
      >
        {/* Center Play/Pause with Skip buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={skipBackward}
            className="w-11 h-11 rounded-full bg-[hsl(0,0%,0%,0.6)] border border-[hsl(0,100%,50%,0.4)] flex items-center justify-center text-[hsl(0,100%,50%)] hover:bg-[hsl(0,100%,50%,0.15)] transition-colors"
            title="Skip back 10s"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

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

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={skipForward}
            className="w-11 h-11 rounded-full bg-[hsl(0,0%,0%,0.6)] border border-[hsl(0,100%,50%,0.4)] flex items-center justify-center text-[hsl(0,100%,50%)] hover:bg-[hsl(0,100%,50%,0.15)] transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward className="w-5 h-5" />
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
                className="text-[hsl(0,0%,100%)] hover:text-[hsl(0,100%,50%)] transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={skipBackward}
                className="text-[hsl(0,100%,50%)] hover:text-[hsl(0,100%,65%)] transition-colors"
                title="-10s"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={skipForward}
                className="text-[hsl(0,100%,50%)] hover:text-[hsl(0,100%,65%)] transition-colors"
                title="+10s"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="text-[hsl(0,0%,100%)] hover:text-[hsl(0,100%,50%)] transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs text-[hsl(0,0%,70%)] font-mono">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
            </div>
            <div className="flex items-center gap-3 relative">
              {/* Settings Button */}
              <button
                onClick={toggleSettings}
                className={`transition-colors ${
                  showSettings
                    ? "text-[hsl(0,100%,50%)]"
                    : "text-[hsl(0,0%,100%)] hover:text-[hsl(0,100%,50%)]"
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-[hsl(0,0%,100%)] hover:text-[hsl(0,100%,50%)] transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    ref={settingsRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full right-0 mb-2 w-52 rounded-xl bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,20%)] shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Quality */}
                    <div className="p-3 border-b border-[hsl(0,0%,15%)]">
                      <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
                        Quality
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {QUALITY_OPTIONS.map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              quality === q
                                ? "bg-[hsl(0,100%,50%,0.15)] text-[hsl(0,100%,50%)]"
                                : "text-[hsl(0,0%,80%)] hover:bg-[hsl(0,0%,15%)]"
                            }`}
                          >
                            <span>{q}</span>
                            {quality === q && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
                        Speed
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {SPEED_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              speed === s
                                ? "bg-[hsl(0,100%,50%,0.15)] text-[hsl(0,100%,50%)]"
                                : "text-[hsl(0,0%,80%)] hover:bg-[hsl(0,0%,15%)]"
                            }`}
                          >
                            <span>{s === 1 ? "Normal" : `${s}x`}</span>
                            {speed === s && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
