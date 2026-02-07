import { Link } from "react-router-dom";
import { Star, Bookmark } from "lucide-react";
import type { DbSeries } from "@/hooks/useSeriesData";
import { statusLabel } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useNavigate } from "react-router-dom";

interface AnimeCardProps {
  series: DbSeries;
  index: number;
}

export default function AnimeCard({ series, index }: AnimeCardProps) {
  const { user } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const navigate = useNavigate();
  const inList = isInWatchlist(series.id);
  const label = statusLabel(series.status);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleWatchlist(series.id);
  };

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
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={series.image_url || "/placeholder.svg"}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                label === "Airing"
                  ? "bg-primary text-primary-foreground"
                  : label === "Completed"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
              inList
                ? "bg-primary text-primary-foreground"
                : "bg-background/60 backdrop-blur-sm text-foreground hover:bg-primary/80 hover:text-primary-foreground"
            }`}
            title={inList ? "Remove from My List" : "Add to My List"}
          >
            <Bookmark className={`w-4 h-4 ${inList ? "fill-current" : ""}`} />
          </button>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-display font-bold text-sm leading-tight mb-1 text-foreground">
              {series.title}
            </h3>
            <div className="flex items-center gap-2">
              {series.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {series.rating}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {series.episode_count} eps
              </span>
            </div>
            <div className="flex gap-1 mt-1.5">
              {series.genres.slice(0, 3).map((g) => (
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
