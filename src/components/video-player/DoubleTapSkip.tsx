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
  onSingleTap?: () => void;
  onLongPressStart?: (side: "left" | "right") => void;
  onLongPressEnd?: () => void;
}

export default function DoubleTapSkip({ onSkipForward, onSkipBackward, onSingleTap, onLongPressStart, onLongPressEnd }: DoubleTapSkipProps) {
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const [longPressSide, setLongPressSide] = useState<"left" | "right" | null>(null);
  const lastTapRef = useRef<{ time: number; side: "left" | "right" } | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const idRef = useRef(0);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const endLongPress = useCallback(() => {
    cancelLongPress();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      setLongPressSide(null);
      onLongPressEnd?.();
    }
  }, [cancelLongPress, onLongPressEnd]);

  const createPointerDown = useCallback(
    (side: "left" | "right") => (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const now = Date.now();

      // Start long-press timer (500ms hold)
      cancelLongPress();
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setLongPressSide(side);
        onLongPressStart?.(side);
        // Cancel any pending single-tap or double-tap
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        lastTapRef.current = null;
      }, 500);

      // Double-tap detection
      if (lastTapRef.current && now - lastTapRef.current.time < 350 && lastTapRef.current.side === side) {
        e.preventDefault();
        e.stopPropagation();
        cancelLongPress();

        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }

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

        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = setTimeout(() => {
          singleTapTimerRef.current = null;
          if (!isLongPressRef.current) onSingleTap?.();
        }, 350);
      }
    },
    [onSkipForward, onSkipBackward, onSingleTap, onLongPressStart, cancelLongPress]
  );

  const handlePointerUp = useCallback(() => {
    endLongPress();
  }, [endLongPress]);

  const handlePointerCancel = useCallback(() => {
    endLongPress();
  }, [endLongPress]);

  return (
    <>
      {/* Left zone */}
      <div
        className="absolute top-0 left-0 bottom-0"
        style={{ width: "35%", pointerEvents: "auto", touchAction: "manipulation", zIndex: 2147483644 }}
        onPointerDown={createPointerDown("left")}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerUp}
      />
      {/* Right zone */}
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: "35%", pointerEvents: "auto", touchAction: "manipulation", zIndex: 2147483644 }}
        onPointerDown={createPointerDown("right")}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerUp}
      />

      {/* Long-press speed indicator */}
      <AnimatePresence>
        {longPressSide && (
          <motion.div
            key="speed-indicator"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              zIndex: 2147483645,
              top: "50%",
              left: longPressSide === "left" ? "15%" : "85%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "hsla(0,0%,0%,0.6)", backdropFilter: "blur(4px)" }}>
              <span className="text-sm font-bold text-[hsl(0,0%,100%)]">
                {longPressSide === "right" ? "2×▶▶" : "◀◀2×"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple animations */}
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
