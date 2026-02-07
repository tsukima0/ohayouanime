import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ShortActionsProps {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  isMuted: boolean;
  onToggleLike: () => void;
  onCommentOpen: () => void;
  onShareOpen: () => void;
  onToggleMute: () => void;
}

export default function ShortActions({
  liked,
  likesCount,
  commentsCount,
  isMuted,
  onToggleLike,
  onCommentOpen,
  onShareOpen,
  onToggleMute,
}: ShortActionsProps) {
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const handleLike = () => {
    if (!liked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 600);
    }
    onToggleLike();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Mute */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={onToggleMute}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-foreground" />
          ) : (
            <Volume2 className="w-6 h-6 text-foreground" />
          )}
        </div>
      </motion.button>

      {/* Like */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <Heart
              className={`w-7 h-7 transition-colors duration-200 ${
                liked ? "text-primary fill-primary" : "text-foreground"
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-foreground drop-shadow-md">
            {formatCount(likesCount)}
          </span>
        </motion.button>

        {/* Heart burst particles */}
        <AnimatePresence>
          {showHeartBurst && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0.5],
                    opacity: [1, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 30,
                    y: Math.sin((i * Math.PI * 2) / 6) * 30 - 10,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none"
                >
                  <Heart className="w-3 h-3 text-primary fill-primary" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Comment */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={onCommentOpen}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-foreground" />
        </div>
        <span className="text-xs font-semibold text-foreground drop-shadow-md">
          {formatCount(commentsCount)}
        </span>
      </motion.button>

      {/* Share */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={onShareOpen}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
          <Share2 className="w-7 h-7 text-foreground" />
        </div>
        <span className="text-xs font-semibold text-foreground drop-shadow-md">
          Share
        </span>
      </motion.button>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
