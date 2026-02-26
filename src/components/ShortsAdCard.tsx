import { useAds } from "@/hooks/useAds";
import { ExternalLink } from "lucide-react";
import { useRef, useEffect } from "react";

export default function ShortsAdCard() {
  const { data: ads } = useAds("shorts");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  if (!ads || ads.length === 0) return null;

  const ad = ads[Math.floor(Math.random() * ads.length)];

  const media = ad.video_url ? (
    <video
      ref={videoRef}
      src={ad.video_url}
      className="w-full h-full object-cover"
      loop
      muted
      playsInline
      autoPlay
    />
  ) : (
    <img
      src={ad.image_url}
      alt={ad.title}
      className="w-full h-full object-cover"
    />
  );

  const content = (
    <div className="h-full w-full flex items-center justify-center bg-background relative">
      <div className="relative w-full h-full max-w-lg mx-auto overflow-hidden">
        {media}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-20 left-0 right-0 px-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">
            Sponsored
          </span>
          <p className="font-display text-xl font-bold text-foreground mb-3">{ad.title}</p>
          {ad.link_url && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              Learn More
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer nofollow" className="block h-full">
        {content}
      </a>
    );
  }

  return content;
}
