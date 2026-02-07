import { Link } from "react-router-dom";
import { Play, Clock, Sparkles } from "lucide-react";
import type { DbEpisode } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface NewEpisodeCardProps {
  episode: DbEpisode & { series: { id: string; title: string; image_url: string | null } | null };
  index: number;
}

export default function NewEpisodeCard({ episode, index }: NewEpisodeCardProps) {
  const imageSrc = episode.series?.image_url || episode.thumbnail_url || "/placeholder.svg";
  const releasedAgo = formatDistanceToNow(new Date(episode.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/watch/${episode.id}`}
        className="group flex items-center gap-4 p-3 rounded-xl glass-card border border-border hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img
            src={imageSrc}
            alt={episode.series?.title || "Episode"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/30">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              New
            </span>
            <span className="text-[11px] text-muted-foreground">{releasedAgo}</span>
          </div>
          <p className="text-xs font-semibold text-primary">{episode.series?.title}</p>
          <h3 className="font-display font-bold text-sm text-foreground truncate">
            E{episode.episode_number}: {episode.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(episode.duration)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
