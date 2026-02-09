import { useRef, useEffect } from "react";
import { Settings, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface VideoSettingsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}

export default function VideoSettingsMenu({
  isOpen,
  onToggle,
  speed,
  onSpeedChange,
}: VideoSettingsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

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
            className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[hsl(0,0%,8%,0.95)] border border-[hsl(0,0%,20%)] shadow-2xl overflow-hidden backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(0,0%,50%)] font-semibold mb-2">
                Playback Speed
              </p>
              <div className="flex flex-col gap-0.5">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      speed === s
                        ? "bg-primary/15 text-primary"
                        : "text-[hsl(0,0%,80%)] hover:bg-[hsl(0,0%,15%)]"
                    }`}
                  >
                    <span>{s === 1 ? "Normal" : `${s}x`}</span>
                    {speed === s && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
