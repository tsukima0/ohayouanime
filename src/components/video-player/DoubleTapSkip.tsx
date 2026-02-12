import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RippleEvent {
  id: number;
  side: "left" | "right";
  x: number;
  y: number;
}

interface DoubleTapSkipProps {
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onFirstTap?: () => void;
}

export default function DoubleTapSkip({ onSkipForward, onSkipBackward, onFirstTap }: DoubleTapSkipProps) {
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const lastTapRef = useRef<{ time: number; side: "left" | "right" } | null>(null);
  const idRef = useRef(0);

  const createHandler = useCallback(
    (side: "left" | "right") => (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const now = Date.now();

      if (lastTapRef.current && now - lastTapRef.current.time < 350 && lastTapRef.current.side === side) {
        e.preventDefault();
        e.stopPropagation();

        if (side === "right") onSkipForward();
        else onSkipBackward();

        const ripple: RippleEvent = {
          id: ++idRef.current,
          side,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        setRipples((prev) => [...prev, ripple]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 800);

        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, side };
        onFirstTap?.();
      }
    },
    [onSkipForward, onSkipBackward]
  );

  return (
    <>
      {/* Left zone */}
      <div
        className="absolute top-0 left-0 bottom-0"
        style={{ width: "50%", pointerEvents: "auto", touchAction: "manipulation", zIndex: 2147483644 }}
        onPointerDown={createHandler("left")}
      />
      {/* Right zone */}
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: "50%", pointerEvents: "auto", touchAction: "manipulation", zIndex: 2147483644 }}
        onPointerDown={createHandler("right")}
      />

      {/* Ripple animations (full overlay, pointer-events-none) */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2147483645 }}>
        <AnimatePresence>
          {ripples.map((r) => {
            const centerX = r.side === "left" ? "15%" : "85%";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0.7, scale: 0.3 }}
                animate={{ opacity: 0, scale: 2.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute pointer-events-none"
                style={{
                  left: `calc(${centerX} - 50px)`,
                  top: r.y - 50,
                  width: 100,
                  height: 100,
                }}
              >
                <div className="w-full h-full rounded-full bg-foreground/15" />
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-sm font-bold text-[hsl(0,0%,100%)] drop-shadow-lg">
                    {r.side === "right" ? "+10s" : "−10s"}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
