import { useParams, Link } from "react-router-dom";
import { useSeriesById, useEpisodesBySeries } from "@/hooks/useSeriesData";
import { formatTimestamp, statusLabel } from "@/lib/utils";
import { Star, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import VideoThumbnail from "@/components/VideoThumbnail";
import SEO from "@/components/SEO";

export default function SeriesDetailPage() {
  const { seriesId } = useParams();
  const { data: series, isLoading: seriesLoading } = useSeriesById(seriesId);
  const { data: episodes = [], isLoading: episodesLoading } = useEpisodesBySeries(seriesId);
  const imageSrc = series?.image_url || "/placeholder.svg";

  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Skeleton className="w-full h-[50vh]" />
        <div className="max-w-4xl mx-auto px-4 mt-10 space-y-3">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

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

  const label = statusLabel(series.status);

  const desc = (series.description || `Watch ${series.title} on Ohayou Anime — ${series.episode_count} episodes available.`).slice(0, 300);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: series.title,
    description: desc,
    image: imageSrc,
    genre: series.genres,
    numberOfEpisodes: series.episode_count,
    aggregateRating: series.rating
      ? { "@type": "AggregateRating", ratingValue: series.rating, bestRating: 10, ratingCount: 1 }
      : undefined,
    url: `https://ohayouanime.lovable.app/series/${series.id}`,
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      <SEO
        title={`${series.title} — Ohayou Anime`}
        description={desc}
        path={`/series/${series.id}`}
        image={imageSrc}
        type="video.tv_show"
        jsonLd={jsonLd}
      />
      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <img
          src={imageSrc}
          alt={series.title}
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
                label === "Airing"
                  ? "bg-primary text-primary-foreground"
                  : label === "Completed"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {label}
              </span>
              {series.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-sm font-medium text-foreground">{series.rating}</span>
                </div>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-foreground">
              {series.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-3 leading-relaxed">
              {series.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{series.episode_count} Episodes</span>
              <span>•</span>
              <div className="flex gap-1.5">
                {series.genres.map((g) => (
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
                  {episode.thumbnail_url ? (
                    <img
                      src={episode.thumbnail_url}
                      alt={`Episode ${episode.episode_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : episode.video_url ? (
                    <VideoThumbnail
                      videoUrl={episode.video_url}
                      alt={`Episode ${episode.episode_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={imageSrc}
                      alt={`Episode ${episode.episode_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
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
                    EP {episode.episode_number}
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
