import { useRef, useState, useCallback } from "react";

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function VideoProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  onDragStart,
  onDragEnd,
}: VideoProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const getProgress = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Pause video while scrubbing (YouTube-style)
      onDragStart?.();

      const ratio = getProgress(e.clientX);
      const seekTime = Math.round(ratio * duration * 10) / 10;
      onSeek(seekTime);
    },
    [duration, onSeek, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ratio = getProgress(e.clientX);
      setHoverProgress(ratio * 100);
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const seekTime = Math.round(ratio * duration * 10) / 10;
        onSeek(seekTime);
      }
    },
    [isDragging, duration, onSeek]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);

      // Resume playback after scrubbing
      onDragEnd?.();
    },
    [isDragging, onDragEnd]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      className={`w-full cursor-pointer transition-all ${
        isDragging ? "h-3" : "h-1.5 hover:h-3"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => setHoverProgress(null)}
      style={{ touchAction: "none" }}
    >
      <div className="relative w-full h-full rounded-full overflow-hidden bg-[hsl(0,0%,100%,0.2)]">
        {/* Buffered */}
        <div
          className="absolute top-0 left-0 h-full bg-[hsl(0,0%,100%,0.3)] transition-[width] duration-300"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Hover preview line */}
      {hoverProgress !== null && !isDragging && (
        <div
          className="absolute top-0 h-full w-0.5 bg-[hsl(0,0%,100%,0.5)]"
          style={{ left: `${hoverProgress}%` }}
        />
      )}
    </div>
  );
}
