import { useEffect, useState, useRef, useCallback } from "react";

interface ShortProgressBarProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export default function ShortProgressBar({ videoRef, isActive }: ShortProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!isActive || isDragging) {
      if (!isActive) setProgress(0);
      return;
    }

    const update = () => {
      const video = videoRef.current;
      if (video && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, videoRef, isDragging]);

  const seekToPosition = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      const video = videoRef.current;
      if (!bar || !video || !video.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = ratio * video.duration;
      setProgress(ratio * 100);
    },
    [videoRef]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      seekToPosition(e.clientX);
    },
    [seekToPosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      seekToPosition(e.clientX);
    },
    [isDragging, seekToPosition]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
    },
    [isDragging]
  );

  return (
    <div
      ref={barRef}
      className={`absolute bottom-0 left-0 right-0 z-30 cursor-pointer transition-all ${
        isDragging ? "h-3" : "h-1.5 hover:h-3"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0 bg-foreground/10" />
      <div
        className="absolute top-0 left-0 bottom-0 bg-primary transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
      {/* Drag thumb */}
      {isDragging && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      )}
    </div>
  );
}
