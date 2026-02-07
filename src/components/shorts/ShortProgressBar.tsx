import { useEffect, useState, useRef } from "react";

interface ShortProgressBarProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export default function ShortProgressBar({ videoRef, isActive }: ShortProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
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
  }, [isActive, videoRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10 z-30">
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
