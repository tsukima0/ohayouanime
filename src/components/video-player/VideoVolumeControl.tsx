import { useState } from "react";
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

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className="flex items-center gap-1 group/vol"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle();
        }}
        className="text-[hsl(0,0%,100%)] hover:text-primary transition-colors p-1"
      >
        <VolumeIcon className="w-5 h-5" />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          showSlider ? "w-20 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            e.stopPropagation();
            onVolumeChange(parseFloat(e.target.value));
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-1 accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}
