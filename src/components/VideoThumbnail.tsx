import { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
  seekTime?: number;
}

/**
 * Extracts a frame from a video URL and displays it as an image.
 * Falls back to a gradient placeholder if extraction fails.
 */
export default function VideoThumbnail({
  videoUrl,
  alt,
  className = "",
  seekTime = 2,
}: VideoThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setFailed(true);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    // Only set crossOrigin if the video is from a different origin
    try {
      const videoOrigin = new URL(videoUrl).origin;
      if (videoOrigin !== window.location.origin) {
        video.crossOrigin = "anonymous";
      }
    } catch {
      // Invalid URL, will be caught by error handler
    }

    videoRef.current = video;

    let cancelled = false;

    const handleSeeked = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnailSrc(dataUrl);
        } else {
          setFailed(true);
        }
      } catch {
        // Canvas tainted by cross-origin data — try without crossOrigin
        if (video.crossOrigin) {
          video.crossOrigin = "";
          video.removeEventListener("seeked", handleSeeked);
          // Retry without crossOrigin — just show as failed for now
        }
        setFailed(true);
      }
      video.removeEventListener("seeked", handleSeeked);
      video.src = "";
    };

    const handleLoadedMetadata = () => {
      if (cancelled) return;
      const targetTime = Math.min(seekTime, video.duration * 0.1 || seekTime);
      video.currentTime = targetTime;
    };

    const handleError = () => {
      if (cancelled) return;
      setFailed(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.src = videoUrl;

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.src = "";
      videoRef.current = null;
    };
  }, [videoUrl, seekTime]);

  if (thumbnailSrc) {
    return (
      <img
        src={thumbnailSrc}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  if (failed) {
    return (
      <div className={`bg-gradient-to-br from-muted to-accent flex items-center justify-center ${className}`}>
        <Film className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }

  // Loading state
  return (
    <div className={`bg-muted animate-pulse ${className}`} />
  );
}
