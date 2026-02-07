import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Copy, Twitter, Facebook, Link2, MessageSquare, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ShortShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

const shareOptions = [
  { label: "Copy Link", icon: Copy, action: "copy" },
  { label: "Twitter", icon: Twitter, action: "twitter" },
  { label: "Facebook", icon: Facebook, action: "facebook" },
  { label: "Message", icon: MessageSquare, action: "message" },
  { label: "Email", icon: Mail, action: "email" },
  { label: "More", icon: Link2, action: "more" },
];

export default function ShortShareSheet({ open, onOpenChange, title }: ShortShareSheetProps) {
  const handleShare = async (action: string) => {
    const url = window.location.href;
    const text = title ? `Check out "${title}" on Ohayou Anime!` : "Check this out on Ohayou Anime!";

    switch (action) {
      case "copy":
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
        onOpenChange(false);
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case "message":
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`);
        break;
      case "more":
        if (navigator.share) {
          try {
            await navigator.share({ title: text, url });
          } catch {}
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied!");
        }
        onOpenChange(false);
        break;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-base">Share</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-4 pb-6">
          {shareOptions.map((option, i) => (
            <motion.button
              key={option.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleShare(option.action)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <option.icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
