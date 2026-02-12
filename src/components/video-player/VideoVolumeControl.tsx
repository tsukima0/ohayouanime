import { useState, useRef } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";

interface VideoVolumeControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
}

export default function VideoVolumeControl({
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
}: VideoVolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false);
  const prevVolumeRef = useRef(volume > 0 ? volume : 0.5);

  // Store previous volume when it changes to a non-zero value
  if (!muted && volume > 0) {
    prevVolumeRef.current = volume;
  }

  // Reactive icon based on actual volume state
  const effectiveVolume = muted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume <= 0.4 ? Volume1 : Volume2;

  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (muted || volume === 0) {
      // Unmute: restore previous volume
      onVolumeChange(prevVolumeRef.current || 0.5);
    } else {
      // Mute
      onMuteToggle();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    onVolumeChange(val);
    // If slider moved to 0, auto-mute; if moved from 0, auto-unmute is handled by onVolumeChange
  };

  return (
    <div
      className="relative flex items-center gap-1 group/vol"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      onTouchStart={() => setShowSlider(true)}
    >
      <button
        onClick={handleMuteClick}
        className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1"
      >
        <VolumeIcon className="w-5 h-5" />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          showSlider ? "w-20 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ zIndex: 99999 }}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={handleSliderChange}
          onInput={handleSliderChange}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full h-1 accent-primary cursor-pointer"
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}
