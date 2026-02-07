import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShortActionsProps {
  onCommentOpen: () => void;
  onShareOpen: () => void;
}

export default function ShortActions({ onCommentOpen, onShareOpen }: ShortActionsProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500) + 10);
  const [saved, setSaved] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const handleLike = () => {
    if (!liked) {
      setLikeCount((c) => c + 1);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 600);
    } else {
      setLikeCount((c) => c - 1);
    }
    setLiked(!liked);
  };

  const commentCount = Math.floor(Math.random() * 50) + 1;
  const shareCount = Math.floor(Math.random() * 30) + 1;

  return (
    <div className="flex flex-col items-center gap-5">
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
            {formatCount(likeCount)}
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
          {formatCount(commentCount)}
        </span>
      </motion.button>

      {/* Bookmark */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={() => setSaved(!saved)}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center">
          <Bookmark
            className={`w-7 h-7 transition-colors duration-200 ${
              saved ? "text-primary fill-primary" : "text-foreground"
            }`}
          />
        </div>
        <span className="text-xs font-semibold text-foreground drop-shadow-md">Save</span>
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
          {formatCount(shareCount)}
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
