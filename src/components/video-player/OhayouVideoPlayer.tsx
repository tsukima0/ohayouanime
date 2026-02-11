import { useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./videojs-theme.css";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import DoubleTapSkip from "./DoubleTapSkip";

interface OhayouVideoPlayerProps {
  videoUrl?: string | null;
  episodeTitle: string;
  animeName: string;
  duration: number;
  nextEpisodeId?: string | null;
  /** If true, shows "Watch Full Episode" overlay (for shorts context) */
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

  // Keep ref in sync so button handlers always see latest value
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

  useEffect(() => {
    if (!videoElRef.current) return;

    const videoElement = videoElRef.current.querySelector("video");
    if (!videoElement) return;

    // Determine sources
    const sources: { src: string; type: string }[] = [];
    if (videoUrl) {
      if (videoUrl.includes(".m3u8")) {
        sources.push({ src: videoUrl, type: "application/x-mpegURL" });
      } else {
        sources.push({ src: videoUrl, type: "video/mp4" });
        sources.push({ src: videoUrl, type: "video/webm" });
      }
    }

    // Disable picture-in-picture
    videoElement.disablePictureInPicture = true;
    videoElement.setAttribute("disablePictureInPicture", "");

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      sources,
      poster: poster || undefined,
      controlBar: {
        pictureInPictureToggle: false,
      },
    });

    playerRef.current = player;

    player.ready(() => {
      // Access control bar via getChild
      const controlBar = player.getChild("controlBar") as any;
      if (!controlBar) return;

      // --- Custom Button Factory ---
      const Button = videojs.getComponent("Button") as any;

      // Mobile-friendly handler: use touchstart + click with preventDefault
      const mobileTap = (el: HTMLElement, handler: () => void) => {
        el.addEventListener("touchstart", (e) => {
          e.preventDefault();
          handler();
        }, { passive: false });
        el.addEventListener("click", (e) => {
          e.preventDefault();
          handler();
        });
      };

      // Skip Back 10s
      const skipBack = new Button(player, {});
      skipBack.addClass("vjs-skip-backward-10");
      skipBack.el().innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.5 8-3-3 3-3"/><path d="M9.5 5H16a4 4 0 0 1 0 8h-1"/><path d="M7 15h3v5"/><path d="M14 15a2 2 0 1 0 0 5 2 2 0 0 0 0-5Z"/></svg>`;
      mobileTap(skipBack.el(), () => {
        const ct = player.currentTime() ?? 0;
        player.currentTime(Math.max(0, ct - 10));
      });

      // Skip Forward 10s
      const skipFwd = new Button(player, {});
      skipFwd.addClass("vjs-skip-forward-10");
      skipFwd.el().innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11.5 8 3-3-3-3"/><path d="M14.5 5H8a4 4 0 0 0 0 8h1"/><path d="M7 15h3v5"/><path d="M17 15a2 2 0 1 0 0 5 2 2 0 0 0 0-5Z"/></svg>`;
      mobileTap(skipFwd.el(), () => {
        const ct = player.currentTime() ?? 0;
        const dur = player.duration() ?? 0;
        player.currentTime(Math.min(dur, ct + 10));
      });

      // Next Episode Button
      const nextBtn = new Button(player, {});
      nextBtn.addClass("vjs-next-episode-btn");
      nextBtn.el().innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l11-7z"/><rect x="17" y="5" width="2" height="14" rx="1"/></svg><span>Next</span>`;
      mobileTap(nextBtn.el(), () => {
        if (nextEpRef.current) {
          navigate(`/watch/${nextEpRef.current}`);
        } else {
          toast({ title: "No next episode", description: "You've reached the last available episode." });
        }
      });

      // Insert into control bar
      const playToggle = controlBar.getChild("playToggle");
      const playIdx = playToggle ? controlBar.children().indexOf(playToggle) : 0;

      controlBar.addChild(skipBack, {}, playIdx + 1);
      controlBar.addChild(skipFwd, {}, playIdx + 2);

      // Add next button near the end (before fullscreen)
      const fsBtn = controlBar.getChild("fullscreenToggle");
      const fsIdx = fsBtn ? controlBar.children().indexOf(fsBtn) : controlBar.children().length;
      controlBar.addChild(nextBtn, {}, fsIdx);
    });

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

      {/* Video.js container */}
      <div ref={videoElRef} data-vjs-player>
        <video className="video-js vjs-ohayou vjs-big-play-centered" playsInline crossOrigin="anonymous" />
      </div>
    </div>
  );
}
