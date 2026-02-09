import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShortComments } from "@/hooks/useShortInteractions";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ShortCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortId: string;
}

export default function ShortCommentsSheet({ open, onOpenChange, shortId }: ShortCommentsSheetProps) {
  const { comments, isLoading, addComment, deleteComment, user } = useShortComments(shortId);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(newComment.trim());
    setNewComment("");
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
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                    😊
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.is_own ? "You" : "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 mt-0.5">{comment.text}</p>
                  </div>
                  {comment.is_own && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="shrink-0 pt-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!isLoading && comments.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No comments yet. Be the first!
            </p>
          )}
        </div>

        {/* Comment input */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-border bg-background flex gap-2"
        >
          <div className="flex-1 relative">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 1000))}
              placeholder={user ? "Add a comment..." : "Log in to comment"}
              disabled={!user}
              maxLength={1000}
              className="bg-muted border-0 rounded-full h-10 px-4 pr-14 w-full"
            />
            {newComment.length > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${newComment.length > 900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {newComment.length}/1000
              </span>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || !user}
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
