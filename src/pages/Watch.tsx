import { useParams } from "react-router-dom";
import { getEpisodeById, getNextEpisode } from "@/lib/mock-data";
import VideoPlayer from "@/components/VideoPlayer";
import NextEpisodeCard from "@/components/NextEpisodeCard";
import { Clock, Star, Calendar } from "lucide-react";
import { formatTimestamp } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function WatchPage() {
  const { episodeId } = useParams();
  const episode = getEpisodeById(episodeId || "") || getEpisodeById("ep-001")!;
  const nextEpisode = getNextEpisode(episode.id);

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Player */}
        <motion.div
          key={episode.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VideoPlayer
            episodeTitle={episode.title}
            animeName={episode.animeName}
            duration={episode.duration}
          />
        </motion.div>

        {/* Episode Info */}
        <div className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary mb-1">
                {episode.animeName}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Episode {episode.episodeNumber}: {episode.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(episode.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-primary" />
                <span>9.2</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Season {episode.season}</span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mt-4 max-w-3xl leading-relaxed">
            {episode.description}
          </p>
        </div>

        {/* Next Episode Card */}
        {nextEpisode && (
          <div className="mt-8">
            <NextEpisodeCard episode={nextEpisode} />
          </div>
        )}

      </div>
    </div>
  );
}
