import { useNavigate } from "react-router-dom";
import { Play, Heart, Share2, MessageCircle } from "lucide-react";
import type { DbShort } from "@/hooks/useSeriesData";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShortCardProps {
  short: DbShort;
  isActive: boolean;
}

export default function ShortCard({ short, isActive }: ShortCardProps) {
  const navigate = useNavigate();
  const imageSrc = short.thumbnail_url || "/placeholder.svg";
  const hasVideo = !!short.video_url;

  return (
    <div className="relative w-full h-full snap-start snap-always flex-shrink-0">
      {/* Background - Video or Image */}
      <div className="absolute inset-0">
        {hasVideo && isActive ? (
          <video
            src={short.video_url!}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={imageSrc}
            alt={short.title}
            className="w-full h-full object-cover"
          />
        )}
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
            <h2 className="font-display text-lg font-bold text-foreground leading-tight mb-2">
              {short.title}
            </h2>
            {short.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {short.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span>{formatTimestamp(short.duration)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Play indicator when active */}
      {isActive && !hasVideo && (
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
