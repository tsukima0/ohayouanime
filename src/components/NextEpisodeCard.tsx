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
        <div className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Up Next
          </p>

          {/* Mobile: vertical stack */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Thumbnail + info row */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-32 sm:w-28 h-20 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={thumbSrc}
                  alt={`Episode ${episode.episode_number}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-sm sm:text-xs text-primary font-bold leading-tight">
                  {episode.series?.title}
                </p>
                <p className="text-xs text-foreground font-medium mt-1">
                  Ep {episode.episode_number}: {episode.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{formatTimestamp(episode.duration)}</span>
                  <span>•</span>
                  <span>Season {episode.season}</span>
                </div>
              </div>
            </div>

            {/* Button */}
            <Link
              to={`/watch/${episode.id}`}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <span>Next Episode</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
