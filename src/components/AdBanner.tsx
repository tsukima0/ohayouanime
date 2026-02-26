import { useAds } from "@/hooks/useAds";
import { ExternalLink } from "lucide-react";

interface AdBannerProps {
  placement?: "banner" | "shorts";
  className?: string;
}

export default function AdBanner({ placement = "banner", className = "" }: AdBannerProps) {
  const { data: ads } = useAds(placement);

  if (!ads || ads.length === 0) return null;

  // Pick a random ad each render (simple rotation)
  const ad = ads[Math.floor(Math.random() * ads.length)];

  const content = (
    <div className={`relative rounded-xl overflow-hidden group ${className}`}>
      <img
        src={ad.image_url}
        alt={ad.title}
        className="w-full h-auto object-contain max-h-[180px] sm:max-h-[240px]"
        loading="lazy"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sponsored</span>
            <p className="text-sm font-semibold text-foreground line-clamp-1">{ad.title}</p>
          </div>
          {ad.link_url && (
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  );

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer nofollow" className="block">
        {content}
      </a>
    );
  }

  return content;
}
