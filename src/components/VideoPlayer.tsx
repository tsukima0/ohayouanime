import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";
import VideoProgressBar from "./video-player/VideoProgressBar";
import VideoVolumeControl from "./video-player/VideoVolumeControl";
import VideoSettingsMenu from "./video-player/VideoSettingsMenu";

interface VideoPlayerProps {
  episodeTitle: string;
  animeName: string;
  duration: number;
  videoUrl?: string | null;
}

export default function VideoPlayer({
  episodeTitle,
  animeName,
  duration,
  videoUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const hasVideo = !!videoUrl;

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) {
      setIsLoading(false);
      return;
    }

    const onLoadStart = () => { setIsLoading(true); setError(null); };
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => { setIsLoading(false); setIsPlaying(true); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setIsLoading(false);
      const mediaError = video.error;
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            setError("Playback aborted");
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            setError("Network error — check your connection");
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError("Video format not supported by your browser");
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError("Video format not supported");
            break;
          default:
            setError("An unknown error occurred");
        }
      } else {
        setError("Failed to load video");
      }
    };

    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [hasVideo, videoUrl]);

  // Apply speed
  useEffect(() => {
    if (videoRef.current && hasVideo) videoRef.current.playbackRate = speed;
  }, [speed, hasVideo]);

  // Apply volume/mute
  useEffect(() => {
    if (videoRef.current && hasVideo) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, hasVideo]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3000);
    }
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [showControls, isPlaying]);

  // Fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Simulated playback fallback
  useEffect(() => {
    if (hasVideo) return;
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= videoDuration) { setIsPlaying(false); return videoDuration; }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, videoDuration, speed, hasVideo]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasVideo && videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    } else {
      setIsPlaying((p) => !p);
    }
  }, [hasVideo]);

  const handleSeek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(videoDuration, time));
    setCurrentTime(clamped);
    if (hasVideo && videoRef.current) videoRef.current.currentTime = clamped;
  }, [videoDuration, hasVideo]);

  const skip = useCallback((seconds: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSeek(currentTime + seconds);
  }, [currentTime, handleSeek]);

  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    try {
      if (!document.fullscreenElement) await playerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    if (v > 0 && isMuted) setIsMuted(false);
  }, [isMuted]);

  return (
    <div
      ref={playerRef}
      className="cinema-player relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer bg-black"
      onClick={() => { setShowControls(true); setShowSettings(false); }}
      onDoubleClick={toggleFullscreen as any}
    >
      {/* Video Element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          key={videoUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        >
          <source src={videoUrl!} type="video/mp4" />
          <source src={videoUrl!} type="video/webm" />
          <source src={videoUrl!} />
        </video>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,4%)] via-[hsl(0,0%,2%)] to-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-[hsl(0,0%,50%)] text-sm mb-2">{animeName}</p>
            <p className="text-[hsl(0,0%,80%)] text-xl font-display font-bold">{episodeTitle}</p>
            <p className="text-[hsl(0,0%,40%)] text-sm mt-2">
              {isPlaying ? "▶ Playing" : "⏸ Paused"} — {formatTimestamp(Math.floor(currentTime))}
            </p>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && hasVideo && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-4">
          <AlertCircle className="w-12 h-12 text-primary" />
          <p className="text-[hsl(0,0%,80%)] text-sm text-center max-w-xs">{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); retry(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls && !error ? 1 : 0 }}
        className="absolute inset-0 z-10 transition-opacity"
        style={{ pointerEvents: showControls && !error ? "auto" : "none" }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={skip(-10)}
            className="w-10 h-10 rounded-full bg-[hsl(0,0%,100%,0.15)] backdrop-blur-sm flex items-center justify-center text-[hsl(0,0%,100%)] hover:bg-[hsl(0,0%,100%,0.25)] transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[hsl(0,0%,100%,0.2)] backdrop-blur-md flex items-center justify-center text-[hsl(0,0%,100%)] hover:bg-[hsl(0,0%,100%,0.3)] transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={skip(10)}
            className="w-10 h-10 rounded-full bg-[hsl(0,0%,100%,0.15)] backdrop-blur-sm flex items-center justify-center text-[hsl(0,0%,100%)] hover:bg-[hsl(0,0%,100%,0.25)] transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          {/* Progress Bar */}
          <VideoProgressBar
            currentTime={currentTime}
            duration={videoDuration}
            buffered={buffered}
            onSeek={handleSeek}
          />

          {/* Controls Row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <VideoVolumeControl
                volume={volume}
                muted={isMuted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={() => setIsMuted((m) => !m)}
              />
              <span className="text-xs text-[hsl(0,0%,70%)] font-mono ml-1">
                {formatTimestamp(Math.floor(currentTime))} / {formatTimestamp(Math.floor(videoDuration))}
              </span>
              {speed !== 1 && (
                <span className="text-[10px] text-primary font-semibold ml-1">{speed}x</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <VideoSettingsMenu
                isOpen={showSettings}
                onToggle={() => setShowSettings((p) => !p)}
                speed={speed}
                onSpeedChange={setSpeed}
                subtitleAppearance={{ fontScale: 1, bgOpacity: 0.75, position: "bottom" }}
                onSubtitleAppearanceChange={() => {}}
              />
              <button
                onClick={toggleFullscreen}
                className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
