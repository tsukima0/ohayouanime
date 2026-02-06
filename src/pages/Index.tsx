import { Link } from "react-router-dom";
import { Play, TrendingUp, Tv, ArrowRight, History, Sparkles } from "lucide-react";
import { mockTrendingSeries, simulcastSeries, mockShorts, mockContinueWatching, mockNewEpisodes } from "@/lib/mock-data";
import AnimeCard from "@/components/AnimeCard";
import ContinueWatchingCard from "@/components/ContinueWatchingCard";
import NewEpisodeCard from "@/components/NewEpisodeCard";
import { motion } from "framer-motion";
import heroBanner from "@/assets/hero-banner.jpg";

import short1Img from "@/assets/short-1.jpg";
import short2Img from "@/assets/short-2.jpg";
import short3Img from "@/assets/short-3.jpg";
import { formatTimestamp } from "@/lib/mock-data";

const shortImages: Record<string, string> = {
  "short-1": short1Img,
  "short-2": short2Img,
  "short-3": short3Img,
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Hero Banner */}
      <section className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden">
        <img
          src={heroBanner}
          alt="Shadow Requiem anime hero banner"
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
              NEW EPISODE
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3">
              Shadow Requiem
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
              In a world where shadows hold ancient power, Kaito discovers he is the last heir to a forgotten bloodline.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/watch/ep-001"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:scale-105 glow-primary"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Link>
              <Link
                to="/shorts"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-all hover:scale-105 border border-border"
              >
                Browse Shorts
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Continue Watching Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              Continue Watching
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockContinueWatching.map((item, index) => (
            <ContinueWatchingCard key={item.episodeId} item={item} index={index} />
          ))}
        </div>
      </section>

      {/* New Episodes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              New Episodes
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mockNewEpisodes.map((item, index) => (
            <NewEpisodeCard key={item.episodeId} item={item} index={index} />
          ))}
        </div>
      </section>

      {/* Trending Shorts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              Trending Shorts
            </h2>
          </div>
          <Link
            to="/shorts"
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockShorts.map((short, index) => (
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
                <div className="aspect-[9/14] sm:aspect-[9/12] relative overflow-hidden">
                  <img
                    src={shortImages[short.id]}
                    alt={short.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                  {/* Play Button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
                      <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs font-semibold text-primary mb-1">
                      {short.animeName}
                    </p>
                    <h3 className="font-display font-bold text-sm mb-1 text-foreground">
                      {short.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{short.views} views</span>
                      <span>•</span>
                      <span>at {formatTimestamp(short.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Simulcast Seasons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center gap-3 mb-6">
          <Tv className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            Simulcast Seasons
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mockTrendingSeries.map((series, index) => (
            <AnimeCard key={series.id} series={series} index={index} />
          ))}
        </div>
      </section>

      {/* Currently Airing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Play className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            Currently Airing
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {simulcastSeries.map((series, index) => (
            <AnimeCard key={series.id} series={series} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
