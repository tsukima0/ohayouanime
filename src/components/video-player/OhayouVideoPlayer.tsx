import { useEffect, useRef, useCallback, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./videojs-theme.css";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import DoubleTapSkip from "./DoubleTapSkip";
import CustomControlBar from "./CustomControlBar";
import SubtitleDisplay from "./SubtitleDisplay";
import type { SubtitleTrack } from "./VideoSubtitleMenu";
import { type SubtitleAppearance, DEFAULT_SUBTITLE_APPEARANCE, loadSubtitleAppearance, saveSubtitleAppearance } from "./VideoSettingsMenu";


interface OhayouVideoPlayerProps {
  videoUrl?: string | null;
  episodeTitle: string;
  animeName: string;
  duration: number;
  nextEpisodeId?: string | null;
  fullEpisodeId?: string | null;
  poster?: string | null;
  subtitleTracks?: SubtitleTrack[];
  /** Called periodically with (currentTime, duration) so callers can save progress */
  onTimeUpdate?: React.MutableRefObject<(currentTime: number, duration: number) => void>;
}

export default function OhayouVideoPlayer({
  videoUrl,
  episodeTitle,
  animeName,
  duration,
  nextEpisodeId,
  fullEpisodeId,
  poster,
  subtitleTracks = [],
  onTimeUpdate,
}: OhayouVideoPlayerProps) {
  const videoElRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const nextEpRef = useRef(nextEpisodeId);
  const areaTapRef = useRef<(() => void) | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const [subtitleAppearance, setSubtitleAppearance] = useState<SubtitleAppearance>(loadSubtitleAppearance);
  const [controlsVisible, setControlsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    nextEpRef.current = nextEpisodeId;
  }, [nextEpisodeId]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleWatchFull = useCallback(() => {
    if (fullEpisodeId) navigate(`/watch/${fullEpisodeId}`);
  }, [fullEpisodeId, navigate]);

  const handleSkipForward = useCallback(() => {
    const p = playerRef.current;
    if (!p || (p as any).isDisposed()) return;
    const ct = p.currentTime() ?? 0;
    const dur = p.duration() ?? 0;
    p.currentTime(Math.min(dur, ct + 10));
  }, []);

  const handleSkipBackward = useCallback(() => {
    const p = playerRef.current;
    if (!p || (p as any).isDisposed()) return;
    const ct = p.currentTime() ?? 0;
    p.currentTime(Math.max(0, ct - 10));
  }, []);

  const handleNext = useCallback(() => {
    if (nextEpRef.current) {
      navigate(`/watch/${nextEpRef.current}`);
    } else {
      toast({ title: "No next episode", description: "You've reached the last available episode." });
    }
  }, [navigate]);

  // Toggle play/pause on center click
  const handleCenterClick = useCallback(() => {
    const p = playerRef.current;
    if (!p || (p as any).isDisposed()) return;
    if (p.paused()) p.play();
    else p.pause();
    areaTapRef.current?.();
  }, []);

  // Handle subtitle track changes — just track the active URL, SubtitleDisplay handles rendering
  const [activeSubtitleUrl, setActiveSubtitleUrl] = useState<string | null>(null);

  const handleSubtitleChange = useCallback((track: SubtitleTrack | null) => {
    if (track) {
      setActiveSubtitleId(track.id);
      setActiveSubtitleUrl(track.file_url);
    } else {
      setActiveSubtitleId(null);
      setActiveSubtitleUrl(null);
    }
  }, []);

  useEffect(() => {
    if (!videoElRef.current) return;

    const videoElement = videoElRef.current.querySelector("video");
    if (!videoElement) return;

    const sources: { src: string; type: string }[] = [];
    if (videoUrl) {
      if (videoUrl.includes(".m3u8")) {
        sources.push({ src: videoUrl, type: "application/x-mpegURL" });
      } else {
        sources.push({ src: videoUrl, type: "video/mp4" });
        sources.push({ src: videoUrl, type: "video/webm" });
      }
    }

    videoElement.disablePictureInPicture = true;
    videoElement.setAttribute("disablePictureInPicture", "");

    const player = videojs(videoElement, {
      controls: false, // Disable default controls — we use custom
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      sources,
      poster: poster || undefined,
      controlBar: false as any,
    });

    playerRef.current = player;
    setPlayerReady(true);

    // Save progress every 10 seconds
    let saveInterval: ReturnType<typeof setInterval> | null = null;
    if (onTimeUpdate) {
      saveInterval = setInterval(() => {
        const p = playerRef.current;
        if (!p || (p as any).isDisposed()) return;
        const ct = p.currentTime() ?? 0;
        const dur = p.duration() ?? 0;
        if (ct > 0 && dur > 0) onTimeUpdate.current(ct, dur);
      }, 10_000);
    }

    return () => {
      if (saveInterval) clearInterval(saveInterval);
      if (playerRef.current && !(playerRef.current as any).isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
        setPlayerReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, poster]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden cinema-player">
      {/* Video.js container — rendered first, sits at the bottom */}
      <div ref={videoElRef} data-vjs-player style={{ position: "relative", zIndex: 0 }}>
        <video className="video-js vjs-ohayou vjs-big-play-centered" playsInline crossOrigin="anonymous" />
      </div>

      {/* Interaction overlay — sits above video in all modes including fullscreen */}
      <div className="absolute inset-0" style={{ zIndex: 2147483640 }}>
        {/* Logo overlay */}
        <div className="vjs-ohayou-logo">
          <img src={logoImg} alt="Ohayou Anime" />
          <span>
            <span className="logo-ohayou">Ohayou</span>{" "}
            <span className="logo-anime">Anime</span>
          </span>
        </div>

        {/* Watch Full Episode overlay for shorts */}
        {fullEpisodeId && (
          <button className="vjs-watch-full-overlay" onClick={handleWatchFull}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" opacity="0.3" />
              <path d="M10 9l5 3-5 3V9z" />
            </svg>
            Watch Full Episode
          </button>
        )}

        {/* Custom subtitle display */}
        <SubtitleDisplay fileUrl={activeSubtitleUrl} playerRef={playerRef} playerReady={playerReady} fontScale={subtitleAppearance.fontScale} bgOpacity={subtitleAppearance.bgOpacity} position={subtitleAppearance.position} controlsVisible={controlsVisible} />

        {/* Double-tap skip overlay (sides) */}
        <DoubleTapSkip onSkipForward={handleSkipForward} onSkipBackward={handleSkipBackward} onSingleTap={() => areaTapRef.current?.()} />

        {/* Center click-to-play zone */}
        <div
          className="absolute top-0 bottom-0 left-[35%] right-[35%] cursor-pointer"
          style={{ zIndex: 2147483643, touchAction: "manipulation", pointerEvents: "auto" }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCenterClick(); }}
        />

        {/* Custom floating control bar */}
        <CustomControlBar
          playerRef={playerRef}
          onNext={handleNext}
          playerReady={playerReady}
          onAreaTapRef={areaTapRef}
          subtitleTracks={subtitleTracks}
          activeSubtitleId={activeSubtitleId}
          onSubtitleChange={handleSubtitleChange}
          subtitleAppearance={subtitleAppearance}
          onSubtitleAppearanceChange={(a) => { setSubtitleAppearance(a); saveSubtitleAppearance(a); }}
          onVisibilityChange={setControlsVisible}
        />
      </div>
    </div>
  );
}
