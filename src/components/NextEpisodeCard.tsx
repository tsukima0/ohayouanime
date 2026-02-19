import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { EpisodeWithSeries } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";

interface NextEpisodeCardProps {
  episode: EpisodeWithSeries;
}

export default function NextEpisodeCard({ episode }: NextEpisodeCardProps) {
  const thumbSrc = episode.thumbnail_url || episode.series?.image_url || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Up Next
          </p>
          <div className="flex items-center gap-4">
            <div className="w-28 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={thumbSrc}
                alt={`Episode ${episode.episode_number}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-semibold mb-0.5">
                {episode.series?.title}
              </p>
              <h3 className="font-display font-bold text-foreground text-sm truncate">
                Episode {episode.episode_number}: {episode.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(episode.duration)} • Season {episode.season}
              </p>
            </div>

            <Link
              to={`/watch/${episode.id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <span>Next Episode</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {episode.description && (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
              {episode.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
