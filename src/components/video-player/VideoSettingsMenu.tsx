import { useRef, useEffect, useState } from "react";
import { Settings, Check, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const FONT_SIZE_OPTIONS = [
  { label: "Small", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "Large", value: 1.3 },
  { label: "Extra Large", value: 1.6 },
] as const;
const BG_OPACITY_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
] as const;
const POSITION_OPTIONS = [
  { label: "Bottom", value: "bottom" },
  { label: "Top", value: "top" },
] as const;

export interface SubtitleAppearance {
  fontScale: number;
  bgOpacity: number;
  position: "bottom" | "top";
}

export const DEFAULT_SUBTITLE_APPEARANCE: SubtitleAppearance = {
  fontScale: 1,
  bgOpacity: 0.75,
  position: "bottom",
};

const STORAGE_KEY = "ohayou-subtitle-appearance";

export function loadSubtitleAppearance(): SubtitleAppearance {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        fontScale: typeof parsed.fontScale === "number" ? parsed.fontScale : DEFAULT_SUBTITLE_APPEARANCE.fontScale,
        bgOpacity: typeof parsed.bgOpacity === "number" ? parsed.bgOpacity : DEFAULT_SUBTITLE_APPEARANCE.bgOpacity,
        position: parsed.position === "top" || parsed.position === "bottom" ? parsed.position : DEFAULT_SUBTITLE_APPEARANCE.position,
      };
    }
  } catch {}
  return { ...DEFAULT_SUBTITLE_APPEARANCE };
}

export function saveSubtitleAppearance(appearance: SubtitleAppearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {}
}

type Page = "main" | "speed" | "subtitleSize" | "subtitleBg" | "subtitlePos";

interface VideoSettingsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  subtitleAppearance: SubtitleAppearance;
  onSubtitleAppearanceChange: (a: SubtitleAppearance) => void;
}

export default function VideoSettingsMenu({
  isOpen,
  onToggle,
  speed,
  onSpeedChange,
  subtitleAppearance,
  onSubtitleAppearanceChange,
}: VideoSettingsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<Page>("main");

  useEffect(() => {
    if (!isOpen) {
      setPage("main");
      return;
    }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  const itemClass = (active: boolean) =>
    `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors w-full text-left ${
      active
        ? "bg-primary/15 text-primary"
        : "text-[hsl(0,0%,80%)] hover:bg-[hsl(0,0%,15%)]"
    }`;

  const backBtn = (
    <button
      onClick={() => setPage("main")}
      className="flex items-center gap-1 text-[10px] text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,80%)] transition-colors mb-1"
    >
      <ChevronLeft className="w-3 h-3" /> Back
    </button>
  );

  const renderPage = () => {
    switch (page) {
      case "speed":
        return (
          <div className="p-3">
            {backBtn}
            <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
              Playback Speed
            </p>
            <div className="flex flex-col gap-0.5">
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => onSpeedChange(s)} className={itemClass(speed === s)}>
                  <span>{s === 1 ? "Normal" : `${s}x`}</span>
                  {speed === s && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        );
      case "subtitleSize":
        return (
          <div className="p-3">
            {backBtn}
            <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
              Subtitle Size
            </p>
            <div className="flex flex-col gap-0.5">
              {FONT_SIZE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => onSubtitleAppearanceChange({ ...subtitleAppearance, fontScale: o.value })}
                  className={itemClass(subtitleAppearance.fontScale === o.value)}
                >
                  <span>{o.label}</span>
                  {subtitleAppearance.fontScale === o.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        );
      case "subtitleBg":
        return (
          <div className="p-3">
            {backBtn}
            <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
              Background Opacity
            </p>
            <div className="flex flex-col gap-0.5">
              {BG_OPACITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => onSubtitleAppearanceChange({ ...subtitleAppearance, bgOpacity: o.value })}
                  className={itemClass(subtitleAppearance.bgOpacity === o.value)}
                >
                  <span>{o.label}</span>
                  {subtitleAppearance.bgOpacity === o.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        );
      case "subtitlePos":
        return (
          <div className="p-3">
            {backBtn}
            <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
              Subtitle Position
            </p>
            <div className="flex flex-col gap-0.5">
              {POSITION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => onSubtitleAppearanceChange({ ...subtitleAppearance, position: o.value })}
                  className={itemClass(subtitleAppearance.position === o.value)}
                >
                  <span>{o.label}</span>
                  {subtitleAppearance.position === o.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
              Settings
            </p>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => setPage("speed")} className={itemClass(false)}>
                <span>Playback Speed</span>
                <span className="text-[hsl(0,0%,50%)]">{speed === 1 ? "Normal" : `${speed}x`}</span>
              </button>
              <button onClick={() => setPage("subtitleSize")} className={itemClass(false)}>
                <span>Subtitle Size</span>
                <span className="text-[hsl(0,0%,50%)]">
                  {FONT_SIZE_OPTIONS.find((o) => o.value === subtitleAppearance.fontScale)?.label ?? "Normal"}
                </span>
              </button>
              <button onClick={() => setPage("subtitleBg")} className={itemClass(false)}>
                <span>Background</span>
                <span className="text-[hsl(0,0%,50%)]">
                  {BG_OPACITY_OPTIONS.find((o) => o.value === subtitleAppearance.bgOpacity)?.label ?? "75%"}
                </span>
              </button>
              <button onClick={() => setPage("subtitlePos")} className={itemClass(false)}>
                <span>Position</span>
                <span className="text-[hsl(0,0%,50%)] capitalize">{subtitleAppearance.position}</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`p-1 transition-colors ${
          isOpen ? "text-primary" : "text-[hsl(0,0%,100%)] hover:text-primary"
        }`}
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-[hsl(0,0%,8%,0.95)] border border-[hsl(0,0%,20%)] shadow-2xl overflow-hidden backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {renderPage()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
