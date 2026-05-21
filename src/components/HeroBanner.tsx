import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PublicSeries } from "@/hooks/useSeriesData";
import type { EpisodeWithSeries } from "@/hooks/useSeriesData";
import type { FeaturedSeriesItem } from "@/hooks/useFeaturedSeries";

interface HeroBannerProps {
  series: (PublicSeries | FeaturedSeriesItem)[];
  latestEpisodes?: EpisodeWithSeries[];
}

export default function HeroBanner({ series, latestEpisodes }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = series.length;

  const next = useCallback(() => setCurrent((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [paused, count, next]);

  if (count === 0) return <div className="w-full h-[70vh] sm:h-[80vh] bg-muted animate-pulse" />;

  const hero = series[current];
  const bannerUrl = "banner_image_url" in hero && hero.banner_image_url ? hero.banner_image_url : null;
  const heroImage = bannerUrl || hero.image_url || "/placeholder.svg";
  const heroEpisode = latestEpisodes?.find((ep) => ep.series_id === hero.id);

  return (
    <section
      className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={hero.id}
          src={heroImage}
          alt={hero.title}
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 lg:p-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold mb-4">
              FEATURED
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3">
              {hero.title}
            </h1>
            {"tagline" in hero && hero.tagline && (
              <p className="text-primary font-semibold text-sm sm:text-base mb-2">{hero.tagline}</p>
            )}
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mb-6 leading-relaxed line-clamp-3">
              {hero.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {heroEpisode && (
                <Link
                  to={`/watch/${heroEpisode.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:scale-105 glow-primary"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </Link>
              )}
              <Link
                to={`/series/${hero.id}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-all hover:scale-105 border border-border"
              >
                View Series
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {count > 1 && (
        <div className="absolute bottom-4 right-6 sm:right-12 flex gap-2 z-10">
          {series.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
