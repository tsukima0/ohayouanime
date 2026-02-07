import { useParams, Link } from "react-router-dom";
import { getSeriesById, getEpisodesBySeries } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/mock-data";
import { Star, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

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
};

export default function SeriesDetailPage() {
  const { seriesId } = useParams();
  const series = getSeriesById(seriesId || "");
  const episodes = getEpisodesBySeries(seriesId || "");
  const imageSrc = imageMap[seriesId || ""] || seriesShadow;

  if (!series) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Series Not Found</h1>
          <Link to="/" className="text-primary hover:underline text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <img
          src={imageSrc}
          alt={series.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                series.status === "Airing"
                  ? "bg-primary text-primary-foreground"
                  : series.status === "Completed"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {series.status}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="text-sm font-medium text-foreground">{series.rating}</span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-foreground">
              {series.name}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-3 leading-relaxed">
              {series.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{series.episodes} Episodes</span>
              <span>•</span>
              <div className="flex gap-1.5">
                {series.genre.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {episodes.length > 0 && (
              <Link
                to={`/watch/${episodes[0].id}`}
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:scale-105 glow-primary"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Watching
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Episodes List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-5">
          Episodes ({episodes.length})
        </h2>

        <div className="flex flex-col gap-3">
          {episodes.map((episode, index) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                to={`/watch/${episode.id}`}
                className="group flex items-center gap-4 p-3 rounded-xl glass-card border border-border hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
              >
                {/* Episode Thumbnail */}
                <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={imageSrc}
                    alt={`Episode ${episode.episodeNumber}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-background/30 group-hover:bg-background/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5 fill-current text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono text-foreground">
                    {formatTimestamp(episode.duration)}
                  </div>
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-[10px] font-bold text-primary-foreground">
                    EP {episode.episodeNumber}
                  </div>
                </div>

                {/* Episode Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground text-sm sm:text-base truncate">
                    {episode.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {episode.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Season {episode.season}</span>
                    <span>•</span>
                    <span>{formatTimestamp(episode.duration)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
