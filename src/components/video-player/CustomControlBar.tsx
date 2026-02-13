import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  SkipForward, SkipBack } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoProgressBar from "./VideoProgressBar";
import VideoVolumeControl from "./VideoVolumeControl";
import VideoSettingsMenu from "./VideoSettingsMenu";
import VideoSubtitleMenu, { type SubtitleTrack } from "./VideoSubtitleMenu";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface CustomControlBarProps {
  playerRef: React.RefObject<ReturnType<typeof import("video.js").default> | null>;
  onNext: () => void;
  playerReady?: boolean;
  onAreaTapRef?: React.MutableRefObject<(() => void) | null>;
  subtitleTracks?: SubtitleTrack[];
  activeSubtitleId?: string | null;
  onSubtitleChange?: (track: SubtitleTrack | null) => void;
}

export default function CustomControlBar({ playerRef, onNext, playerReady, onAreaTapRef, subtitleTracks = [], activeSubtitleId = null, onSubtitleChange }: CustomControlBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const getPlayer = useCallback(() => {
    const p = playerRef.current;
    if (!p || (p as any).isDisposed()) return null;
    return p;
  }, [playerRef]);

  // Sync state from player
  useEffect(() => {
    const p = getPlayer();
    if (!p) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      setCurrentTime(p.currentTime() ?? 0);
      setDuration(p.duration() ?? 0);
      // buffered
      const buf = p.buffered();
      if (buf && buf.length > 0) {
        setBuffered(buf.end(buf.length - 1));
      }
    };
    const onVolChange = () => {
      setVolume(p.volume() ?? 1);
      setMuted(p.muted() ?? false);
    };
    const onFsChange = () => setIsFullscreen(p.isFullscreen() ?? false);
    const onRateChange = () => setSpeed(p.playbackRate() ?? 1);

    p.on("play", onPlay);
    p.on("pause", onPause);
    p.on("timeupdate", onTime);
    p.on("volumechange", onVolChange);
    p.on("fullscreenchange", onFsChange);
    p.on("ratechange", onRateChange);

    // initial sync
    onVolChange();
    onTime();
    setIsPlaying(!p.paused());

    return () => {
      const pl = getPlayer();
      if (!pl) return;
      pl.off("play", onPlay);
      pl.off("pause", onPause);
      pl.off("timeupdate", onTime);
      pl.off("volumechange", onVolChange);
      pl.off("fullscreenchange", onFsChange);
      pl.off("ratechange", onRateChange);
    };
  }, [getPlayer, playerReady]);

  // Auto-hide logic
  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      const p = getPlayer();
      if (p && !p.paused() && !settingsOpen) {
        setVisible(false);
      }
    }, 3000);
  }, [getPlayer, settingsOpen]);

  // Toggle controls on tap in video area
  const handleVideoAreaTap = useCallback(() => {
    if (visible) {
      setVisible(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [visible, resetHideTimer]);

  // Expose handleVideoAreaTap to parent
  useEffect(() => {
    if (onAreaTapRef) onAreaTapRef.current = handleVideoAreaTap;
    return () => { if (onAreaTapRef) onAreaTapRef.current = null; };
  }, [handleVideoAreaTap, onAreaTapRef]);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const onMove = () => resetHideTimer();

    el.addEventListener("mousemove", onMove);

    resetHideTimer();

    return () => {
      el.removeEventListener("mousemove", onMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) setVisible(true);
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const p = getPlayer();
    if (!p) return;
    if (p.paused()) p.play();else
    p.pause();
  };

  const handleSeek = (time: number) => {
    const p = getPlayer();
    if (p) p.currentTime(time);
  };

  const handleVolumeChange = (v: number) => {
    const p = getPlayer();
    if (!p) return;
    p.volume(v);
    if (v > 0 && p.muted()) p.muted(false);
    if (v === 0) p.muted(true);
  };

  const handleMuteToggle = () => {
    const p = getPlayer();
    if (p) p.muted(!p.muted());
  };

  const handleSpeedChange = (s: number) => {
    const p = getPlayer();
    if (p) p.playbackRate(s);
    setSettingsOpen(false);
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Target the outer cinema-player container so controls stay inside fullscreen
    const container = containerRef.current?.closest(".cinema-player") as HTMLElement | null;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      try {
        await (screen.orientation as any)?.lock?.("portrait");
      } catch {/* not supported or denied */}
    } else {
      await container.requestFullscreen();
      try {
        await (screen.orientation as any)?.lock?.("landscape");
      } catch {/* not supported or denied */}
    }
  };

  // Track fullscreen state via document events (works for container-based fullscreen)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <>

      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          zIndex: 2147483646
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}>

      {/* Progress bar above control bar */}
      <div className="px-3 sm:px-4 mb-1">
        <VideoProgressBar
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={handleSeek} />

      </div>

      {/* Floating pill control bar */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div
            className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full mx-auto max-w-3xl"
            style={{
              background: "hsla(0, 0%, 0%, 0.15)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              border: "1px solid hsla(0, 0%, 100%, 0.04)"
            }}>

          {/* Play/Pause */}
          <button
              onClick={togglePlay}
              className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1 shrink-0">

            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Volume */}
          <VideoVolumeControl
              volume={volume}
              muted={muted}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle} />


          {/* Time display */}
          <span className="text-[hsl(0,0%,100%)] text-xs font-mono whitespace-nowrap select-none shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Center spacer */}
          <div className="flex-1" />

          {/* CC / Subtitles */}
          <VideoSubtitleMenu
            tracks={subtitleTracks}
            activeTrackId={activeSubtitleId}
            onSelect={(t) => onSubtitleChange?.(t)}
          />

          {/* Settings */}
          <VideoSettingsMenu
              isOpen={settingsOpen}
              onToggle={() => setSettingsOpen((o) => !o)}
              speed={speed}
              onSpeedChange={handleSpeedChange} />


          {/* Next Episode */}
          <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1 shrink-0">

            <SkipForward className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
              onClick={toggleFullscreen}
              className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1 shrink-0">

            {isFullscreen ?
              <Minimize className="w-5 h-5" /> :

              <Maximize className="w-5 h-5" />
              }
          </button>
        </div>
        </div>
      </div>
    </>);

}