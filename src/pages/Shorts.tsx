import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { mockShorts } from "@/lib/mock-data";
import ShortCard from "@/components/ShortCard";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ShortsPage() {
  const { shortId } = useParams();
  const initialIndex = shortId
    ? mockShorts.findIndex((s) => s.id === shortId)
    : 0;
  const [activeIndex, setActiveIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Scroll to specific short on mount
  useEffect(() => {
    if (hasScrolled.current) return;
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(
      `[data-index="${initialIndex >= 0 ? initialIndex : 0}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: "auto" });
      hasScrolled.current = true;
    }
  }, [initialIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const cards = container.querySelectorAll("[data-index]");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const scrollTo = (direction: "up" | "down") => {
    const newIndex =
      direction === "up"
        ? Math.max(0, activeIndex - 1)
        : Math.min(mockShorts.length - 1, activeIndex + 1);
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-index="${newIndex}"]`);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-screen pt-16 sm:pt-16 relative bg-background">
      {/* Navigation arrows (desktop) */}
      <div className="hidden sm:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-2 z-30">
        <button
          onClick={() => scrollTo("up")}
          disabled={activeIndex === 0}
          className="p-2 rounded-full glass-card text-foreground hover:text-primary disabled:opacity-30 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollTo("down")}
          disabled={activeIndex === mockShorts.length - 1}
          className="p-2 rounded-full glass-card text-foreground hover:text-primary disabled:opacity-30 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Shorts Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {mockShorts.map((short, index) => (
          <div
            key={short.id}
            data-index={index}
            className="h-full w-full max-w-lg mx-auto"
          >
            <ShortCard short={short} isActive={activeIndex === index} />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="fixed left-4 sm:left-auto sm:right-6 bottom-24 sm:bottom-6 flex sm:flex-col gap-2 z-30">
        {mockShorts.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "bg-primary scale-125 glow-primary-sm"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
