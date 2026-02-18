import { Link } from "react-router-dom";
import { Play, Clock } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import VideoThumbnail from "@/components/VideoThumbnail";

interface EpisodeScrollCardProps {
  id: string;
  title: string;
  episode_number: number;
  season: number;
  duration: number;
  thumbnail_url: string | null;
  video_url: string | null;
  series: { title: string; image_url: string | null } | null;
  /** Progress 0-100 for continue watching */
  progress?: number;
}

export default function EpisodeScrollCard({
  id,
  title,
  episode_number,
  duration,
  thumbnail_url,
  video_url,
  series,
  progress,
}: EpisodeScrollCardProps) {
  const thumb = thumbnail_url || series?.image_url;

  return (
    <Link
      to={`/watch/${id}`}
      className="group flex-shrink-0 w-52 sm:w-60 block rounded-xl overflow-hidden glass-card border border-border hover:border-primary/40 hover:scale-[1.02] transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : video_url ? (
          <VideoThumbnail
            videoUrl={video_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
            <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>
        {/* Progress bar for continue watching */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/60">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[10px] font-semibold text-primary truncate">
          {series?.title}
        </p>
        <h3 className="font-display font-bold text-xs text-foreground truncate mt-0.5">
          E{episode_number}: {title}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(duration)}</span>
        </div>
      </div>
    </Link>
  );
}
