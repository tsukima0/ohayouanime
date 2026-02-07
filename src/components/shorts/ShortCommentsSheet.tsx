import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
}

const MOCK_COMMENTS: Comment[] = [
  { id: "1", user: "anime_fan42", avatar: "🎌", text: "This scene is absolutely legendary! 🔥", time: "2h ago", likes: 24, liked: false },
  { id: "2", user: "otaku_life", avatar: "⚔️", text: "The animation quality is insane", time: "4h ago", likes: 18, liked: false },
  { id: "3", user: "manga_reader", avatar: "📖", text: "Can't wait for the next episode!", time: "6h ago", likes: 9, liked: false },
  { id: "4", user: "sakura_bloom", avatar: "🌸", text: "Who else is watching at 3am? 😂", time: "8h ago", likes: 31, liked: false },
  { id: "5", user: "shonen_king", avatar: "👑", text: "Top 10 anime moments fr fr", time: "12h ago", likes: 15, liked: false },
];

interface ShortCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortCommentsSheet({ open, onOpenChange }: ShortCommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: "you",
      avatar: "😊",
      text: newComment.trim(),
      time: "now",
      likes: 0,
      liked: false,
    };
    setComments([comment, ...comments]);
    setNewComment("");
  };

  const toggleLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl px-0">
        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="font-display text-base">
            {comments.length} Comments
          </SheetTitle>
        </SheetHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[calc(60vh-120px)]">
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.user}
                    </span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5">{comment.text}</p>
                </div>
                <button
                  onClick={() => toggleLike(comment.id)}
                  className="flex flex-col items-center gap-0.5 shrink-0 pt-1"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      comment.liked ? "text-primary fill-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-[10px] text-muted-foreground">{comment.likes}</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Comment input */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-border bg-background flex gap-2"
        >
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-muted border-0 rounded-full h-10 px-4"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim()}
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
