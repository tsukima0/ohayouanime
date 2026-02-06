import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { AnimeSeries } from "@/lib/mock-data";
import { motion } from "framer-motion";

// Image mapping
import seriesShadow from "@/assets/series-shadow-requiem.jpg";
import seriesNeon from "@/assets/series-neon-drift.jpg";
import seriesCrimson from "@/assets/series-crimson-academy.jpg";
import seriesVoid from "@/assets/series-void-walker.jpg";
import seriesBlade from "@/assets/series-blade-symphony.jpg";
import seriesStarfall from "@/assets/series-starfall-chronicle.jpg";

const imageMap: Record<string, string> = {
  "series-1": seriesShadow,
  "series-2": seriesNeon,
  "series-3": seriesCrimson,
  "series-4": seriesVoid,
  "series-5": seriesBlade,
  "series-6": seriesStarfall,
  "sim-1": seriesShadow,
  "sim-2": seriesNeon,
  "sim-3": seriesVoid,
};

interface AnimeCardProps {
  series: AnimeSeries;
  index: number;
}

export default function AnimeCard({ series, index }: AnimeCardProps) {
  const imageSrc = imageMap[series.id] || seriesShadow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/series/${series.id}`}
        className="group block relative rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.03]"
      >
        {/* Image */}
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={imageSrc}
            alt={series.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                series.status === "Airing"
                  ? "bg-primary text-primary-foreground"
                  : series.status === "Completed"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {series.status}
            </span>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-display font-bold text-sm leading-tight mb-1 text-foreground">
              {series.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {series.rating}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {series.episodes} eps
              </span>
            </div>
            <div className="flex gap-1 mt-1.5">
              {series.genre.map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
