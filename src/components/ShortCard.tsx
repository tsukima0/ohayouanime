import { useNavigate } from "react-router-dom";
import { Play, Heart, Share2, MessageCircle } from "lucide-react";
import type { AnimeShort } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/mock-data";
import { motion } from "framer-motion";

import short1Img from "@/assets/short-1.jpg";
import short2Img from "@/assets/short-2.jpg";
import short3Img from "@/assets/short-3.jpg";

const shortImages: Record<string, string> = {
  "short-1": short1Img,
  "short-2": short2Img,
  "short-3": short3Img,
};

interface ShortCardProps {
  short: AnimeShort;
  isActive: boolean;
}

export default function ShortCard({ short, isActive }: ShortCardProps) {
  const navigate = useNavigate();
  const imageSrc = shortImages[short.id] || short1Img;

  const handleWatchFull = () => {
    navigate(`/watch/${short.episodeId}?t=${short.timestamp}`);
  };

  return (
    <div className="relative w-full h-full snap-start snap-always flex-shrink-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt={short.title}
          className="w-full h-full object-cover"
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-4 pb-20 sm:pb-6">
        {/* Side Actions */}
        <div className="absolute right-4 bottom-32 sm:bottom-24 flex flex-col items-center gap-5">
          <motion.button
            whileTap={{ scale: 1.3 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Heart className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {(short.likes / 1000).toFixed(0)}K
            </span>
          </motion.button>
          
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Chat</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Share</span>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="max-w-[75%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-semibold text-primary mb-1">
              {short.animeName}
            </p>
            <h2 className="font-display text-lg font-bold text-foreground leading-tight mb-2">
              {short.title}
            </h2>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {short.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span>{short.views} views</span>
              <span>•</span>
              <span>Clip from {formatTimestamp(short.timestamp)}</span>
            </div>
          </motion.div>

          {/* Watch Full Episode Button */}
          <motion.button
            onClick={handleWatchFull}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary transition-all duration-200 hover:scale-105 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Watch Full Episode</span>
            <span className="ml-1 px-2 py-0.5 rounded-md bg-primary-foreground/20 text-xs">
              {formatTimestamp(short.timestamp)}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Play indicator when active */}
      {isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-primary/30"
          />
        </div>
      )}
    </div>
  );
}
