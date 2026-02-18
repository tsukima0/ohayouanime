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
      onDragStart?.();
      const ratio = getProgress(e.clientX);
      const seekTime = Math.round(ratio * duration * 10) / 10;
      onSeek(seekTime);
    },
    [duration, onSeek, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const ratio = getProgress(e.clientX);
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
      onDragEnd?.();
    },
    [isDragging, onDragEnd]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    /* Tall hit area so the dot never clips */
    <div
      ref={barRef}
      className="relative w-full h-4 flex items-center cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* Track */}
      <div
        className={`relative w-full rounded-full overflow-hidden bg-[hsl(0,0%,100%,0.2)] transition-all ${
          isDragging ? "h-2" : "h-1.5 group-hover:h-2"
        }`}
        style={{ height: isDragging ? "8px" : "6px" }}
      >
        {/* Buffered */}
        <div
          className="absolute top-0 left-0 h-full bg-[hsl(0,0%,100%,0.3)]"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Red dot — positioned absolute within the 16px tall container, centered */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg pointer-events-none"
        style={{ left: `calc(${progress}% - 6px)` }}
      />
    </div>
  );
}
