import { Link } from "react-router-dom";
import { Play, TrendingUp, Tv, ArrowRight } from "lucide-react";
import { useSeries, useShorts, useLatestEpisodes } from "@/hooks/useSeriesData";
import AnimeCard from "@/components/AnimeCard";
import MyListSection from "@/components/MyListSection";
import VideoThumbnail from "@/components/VideoThumbnail";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { motion } from "framer-motion";
import { formatTimestamp } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { user } = useAuth();
  const { watchlistIds } = useWatchlist();
  const { data: allSeries, isLoading: seriesLoading } = useSeries();
  const { data: shorts } = useShorts();
  const { data: latestEpisodes } = useLatestEpisodes();
  const isMobile = useIsMobile();

  const heroSeries = allSeries?.[0];
  const heroImage = heroSeries?.image_url || "/placeholder.svg";
  const heroEpisode = latestEpisodes?.find((ep) => ep.series_id === heroSeries?.id);

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Hero Banner */}
      <section className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden">
        {heroSeries ? (
          <>
            <img
              src={heroImage}
              alt={heroSeries.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 lg:p-16 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className="inline-block px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold mb-4">
                  FEATURED
                </span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3">
                  {heroSeries.title}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
                  {heroSeries.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {heroEpisode && (
                    <Link
                      to={`/watch/${heroEpisode.id}`}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:scale-105 glow-primary"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Watch Now
                    </Link>
                  )}
                  <Link
                    to={`/series/${heroSeries.id}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-all hover:scale-105 border border-border"
                  >
                    View Series
                  </Link>
                </div>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </section>

      {/* My List (only for logged-in users) */}
      {user && <MyListSection watchlistIds={watchlistIds} />}

      {/* Trending Shorts Section */}
      {shorts && shorts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl sm:text-2xl font-bold">Shorts</h2>
            </div>
            <Link
              to="/shorts"
              className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(isMobile ? shorts.slice(0, 2) : shorts.slice(0, 3)).map((short, index) => (
              <motion.div
                key={short.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Link
                  to={`/shorts/${short.id}`}
                  className="group block relative rounded-xl overflow-hidden glass-card hover:scale-[1.02] transition-transform duration-300"
                >
                  <div className="aspect-[9/14] relative overflow-hidden">
                    {short.thumbnail_url ? (
                      <img
                        src={short.thumbnail_url}
                        alt={short.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : short.video_url ? (
                      <VideoThumbnail
                        videoUrl={short.video_url}
                        alt={short.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
                        <Play className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                      <h3 className="font-display font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 text-foreground line-clamp-1">
                        {short.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span>{formatTimestamp(short.duration)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Series */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Tv className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl sm:text-2xl font-bold">All Series</h2>
        </div>
        {seriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : allSeries && allSeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {allSeries.map((series, index) => (
              <AnimeCard key={series.id} series={series} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No series available yet.</p>
        )}
      </section>
    </div>
  );
};

export default Index;
