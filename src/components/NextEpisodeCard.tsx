import { Link } from "react-router-dom";
import { Play, ChevronRight } from "lucide-react";
import type { AnimeEpisode } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/mock-data";
import { motion } from "framer-motion";

interface NextEpisodeCardProps {
  episode: AnimeEpisode;
}

export default function NextEpisodeCard({ episode }: NextEpisodeCardProps) {
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
            {/* Episode thumbnail placeholder */}
            <div className="w-28 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                <Play className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-semibold mb-0.5">
                {episode.animeName}
              </p>
              <h3 className="font-display font-bold text-foreground text-sm truncate">
                Episode {episode.episodeNumber}: {episode.title}
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

          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
            {episode.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
