import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useShorts } from "@/hooks/useSeriesData";
import ShortCard from "@/components/ShortCard";
import ShortsAdCard from "@/components/ShortsAdCard";
import { useAds } from "@/hooks/useAds";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShortsPage() {
  const { shortId } = useParams();
  const { data: shorts = [], isLoading } = useShorts();
  const { data: shortsAds = [] } = useAds("shorts");
  const hasAds = shortsAds.length > 0;

  // Build feed: insert ad after every 3 shorts
  type FeedItem = { type: "short"; short: (typeof shorts)[number]; idx: number } | { type: "ad"; key: string };
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    shorts.forEach((s, i) => {
      items.push({ type: "short", short: s, idx: i });
      if ((i + 1) % 3 === 0 && hasAds) {
        items.push({ type: "ad", key: `ad-${i}` });
      }
    });
    return items;
  }, [shorts, hasAds]);

  const initialIndex = shortId
    ? shorts.findIndex((s) => s.id === shortId)
    : 0;
  const [activeIndex, setActiveIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Update active index when shorts load and shortId matches
  useEffect(() => {
    if (shorts.length > 0 && shortId) {
      const idx = shorts.findIndex((s) => s.id === shortId);
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [shorts, shortId]);

  // Scroll to specific short on mount
  useEffect(() => {
    if (hasScrolled.current || shorts.length === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const targetIdx = initialIndex >= 0 ? initialIndex : 0;
    const target = container.querySelector(`[data-index="${targetIdx}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "auto" });
      hasScrolled.current = true;
    }
  }, [initialIndex, shorts]);

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
  }, [shorts]);

  const scrollTo = (direction: "up" | "down") => {
    const newIndex =
      direction === "up"
        ? Math.max(0, activeIndex - 1)
        : Math.min(shorts.length - 1, activeIndex + 1);
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-index="${newIndex}"]`);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-full max-w-lg h-[80vh] rounded-xl" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No shorts available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-screen relative bg-background -mt-16">
      {/* Navigation arrows (desktop only) */}
      <div className="hidden sm:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-2 z-30">
        <button
          onClick={() => scrollTo("up")}
          disabled={activeIndex === 0}
          className="p-2 rounded-full bg-background/30 backdrop-blur-sm text-foreground hover:text-primary disabled:opacity-30 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollTo("down")}
          disabled={activeIndex === feed.length - 1}
          className="p-2 rounded-full bg-background/30 backdrop-blur-sm text-foreground hover:text-primary disabled:opacity-30 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Shorts Container — full viewport */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {feed.map((item, index) => (
          <div
            key={item.type === "short" ? item.short.id : item.key}
            data-index={index}
            className="h-full w-full max-w-lg mx-auto snap-start"
          >
            {item.type === "short" ? (
              <ShortCard
                short={item.short}
                isActive={activeIndex === index}
                shouldLoad={Math.abs(activeIndex - index) <= 1}
              />
            ) : (
              <ShortsAdCard />
            )}
          </div>
        ))}
      </div>

      {/* Minimal progress dots — desktop side */}
      <div className="hidden sm:flex fixed left-4 bottom-6 flex-col gap-1.5 z-30">
        {feed.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "bg-primary scale-125"
                : "bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
