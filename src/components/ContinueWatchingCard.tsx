import { Link } from "react-router-dom";
import { Play, Clock } from "lucide-react";
import type { ContinueWatchingItem } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/mock-data";
import { motion } from "framer-motion";

import seriesShadow from "@/assets/series-shadow-requiem.jpg";
import seriesNeon from "@/assets/series-neon-drift.jpg";
import seriesVoid from "@/assets/series-void-walker.jpg";
import seriesBlade from "@/assets/series-blade-symphony.jpg";

const seriesImageMap: Record<string, string> = {
  "series-1": seriesShadow,
  "series-2": seriesNeon,
  "series-4": seriesVoid,
  "series-5": seriesBlade,
};

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  index: number;
}

export default function ContinueWatchingCard({ item, index }: ContinueWatchingCardProps) {
  const imageSrc = seriesImageMap[item.seriesId] || seriesShadow;
  const remainingTime = item.duration - item.currentTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/watch/${item.episodeId}`}
        className="group block relative rounded-xl overflow-hidden glass-card hover:scale-[1.02] transition-transform duration-300"
      >
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden">
          <img
            src={imageSrc}
            alt={item.animeName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
              <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
            </div>
          </div>

          {/* Remaining time badge */}
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs text-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(remainingTime)} left</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs font-semibold text-primary mb-0.5">{item.animeName}</p>
          <h3 className="font-display font-bold text-sm text-foreground truncate">
            E{item.episodeNumber}: {item.episodeTitle}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
