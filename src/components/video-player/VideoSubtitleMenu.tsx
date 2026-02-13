import { useState, useRef, useEffect } from "react";
import { Subtitles } from "lucide-react";

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  file_url: string;
}

interface VideoSubtitleMenuProps {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  onSelect: (track: SubtitleTrack | null) => void;
}

export default function VideoSubtitleMenu({ tracks, activeTrackId, onSelect }: VideoSubtitleMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  if (tracks.length === 0) {
    return (
      <button className="text-[hsl(0,0%,100%)]/40 p-1 shrink-0 cursor-not-allowed" disabled>
        <Subtitles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`p-1 transition-colors ${activeTrackId ? "text-primary" : "text-[hsl(0,0%,100%)] hover:text-primary"}`}
      >
        <Subtitles className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 min-w-[140px] rounded-xl py-1.5 overflow-hidden"
          style={{
            background: "hsla(0, 0%, 0%, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid hsla(0, 0%, 100%, 0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-xs transition-colors ${!activeTrackId ? "text-primary font-semibold" : "text-[hsl(0,0%,100%)] hover:text-primary"}`}
          >
            Off
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSelect(t); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors ${activeTrackId === t.id ? "text-primary font-semibold" : "text-[hsl(0,0%,100%)] hover:text-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
