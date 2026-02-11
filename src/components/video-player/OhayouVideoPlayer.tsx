import { useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./videojs-theme.css";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import DoubleTapSkip from "./DoubleTapSkip";
import CustomControlBar from "./CustomControlBar";

interface OhayouVideoPlayerProps {
  videoUrl?: string | null;
  episodeTitle: string;
  animeName: string;
  duration: number;
  nextEpisodeId?: string | null;
  fullEpisodeId?: string | null;
  poster?: string | null;
}

export default function OhayouVideoPlayer({
  videoUrl,
  episodeTitle,
  animeName,
  duration,
  nextEpisodeId,
  fullEpisodeId,
  poster,
}: OhayouVideoPlayerProps) {
  const videoElRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const nextEpRef = useRef(nextEpisodeId);
  const navigate = useNavigate();

  useEffect(() => {
    nextEpRef.current = nextEpisodeId;
  }, [nextEpisodeId]);

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

    return () => {
      if (playerRef.current && !(playerRef.current as any).isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, poster]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden cinema-player">
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

      {/* Double-tap skip overlay */}
      <DoubleTapSkip onSkipForward={handleSkipForward} onSkipBackward={handleSkipBackward} />

      {/* Center click-to-play zone (between double-tap zones) */}
      <div
        className="absolute top-0 bottom-0 left-[30%] right-[30%] z-[9] cursor-pointer"
        onClick={handleCenterClick}
        style={{ touchAction: "manipulation" }}
      />

      {/* Custom floating control bar */}
      <CustomControlBar playerRef={playerRef} onNext={handleNext} />

      {/* Video.js container */}
      <div ref={videoElRef} data-vjs-player>
        <video className="video-js vjs-ohayou vjs-big-play-centered" playsInline crossOrigin="anonymous" />
      </div>
    </div>
  );
}
