import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toEpisodeWithSeries, PublicEpisode } from "@/hooks/useSeriesData";

// Helper re-exported for internal reuse
export { toEpisodeWithSeries };

// New episodes: latest episode per series (all time)
export function useNewEpisodes() {
  return useQuery({
    queryKey: ["newEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data) return [];

      // Keep only the latest episode per series
      const seen = new Set<string>();
      const result: ReturnType<typeof toEpisodeWithSeries>[] = [];
      for (const ep of data as unknown as PublicEpisode[]) {
        if (ep.series_id && !seen.has(ep.series_id)) {
          seen.add(ep.series_id);
          result.push(toEpisodeWithSeries(ep));
        }
      }
      return result;
    },
  });
}

// Most popular: top 5 episodes by view_count
export function useMostPopularEpisodes() {
  return useQuery({
    queryKey: ["mostPopularEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes" as any)
        .select("id, title, description, episode_number, season, duration, thumbnail_url, video_url, series_id, created_at, updated_at, view_count")
        .order("view_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (!data) return [];
      const seriesIds = [...new Set((data as any[]).map((e: any) => e.series_id))];
      const { data: seriesData } = await supabase
        .from("series_public" as any)
        .select("id, title, image_url")
        .in("id", seriesIds);
      const seriesMap = new Map((seriesData as any[] ?? []).map((s: any) => [s.id, s]));
      return (data as any[]).map((ep: any) => {
        const s = seriesMap.get(ep.series_id);
        return {
          id: ep.id ?? "",
          title: ep.title ?? "",
          description: ep.description ?? null,
          episode_number: ep.episode_number ?? 0,
          season: ep.season ?? 1,
          duration: ep.duration ?? 0,
          thumbnail_url: ep.thumbnail_url ?? null,
          video_url: ep.video_url ?? null,
          series_id: ep.series_id ?? null,
          series: s ? { title: s.title ?? "", image_url: s.image_url ?? null } : null,
        };
      });
    },
  });
}

// Genre taglines mapping
const GENRE_TAGLINES: Record<string, { tagline: string; icon: string }> = {
  Action: { tagline: "Get Ready to Fight", icon: "⚔️" },
  Romance: { tagline: "Fall in Love Again", icon: "💕" },
  Comedy: { tagline: "Time to Laugh Out Loud", icon: "😂" },
  Fantasy: { tagline: "Enter Another World", icon: "✨" },
  Horror: { tagline: "Face Your Fears", icon: "👻" },
  Drama: { tagline: "Feel Every Emotion", icon: "🎭" },
  Adventure: { tagline: "Embark on a Journey", icon: "🗺️" },
  "Sci-Fi": { tagline: "Beyond the Stars", icon: "🚀" },
  Mystery: { tagline: "Uncover the Truth", icon: "🔍" },
  Thriller: { tagline: "Edge of Your Seat", icon: "🔥" },
  "Slice of Life": { tagline: "Everyday Magic", icon: "🌸" },
  Supernatural: { tagline: "Beyond the Ordinary", icon: "👁️" },
  Sports: { tagline: "Chase the Victory", icon: "🏆" },
  Mecha: { tagline: "Suit Up & Deploy", icon: "🤖" },
  Isekai: { tagline: "Reborn in a New World", icon: "🌀" },
};

export function getGenreTagline(genre: string) {
  return GENRE_TAGLINES[genre] || { tagline: genre, icon: "🎬" };
}

// Episodes grouped by genre
export function useEpisodesByGenre() {
  return useQuery({
    queryKey: ["episodesByGenre"],
    queryFn: async () => {
      // Fetch all series with their genres
      const { data: seriesData, error: seriesError } = await supabase
        .from("series_public" as any)
        .select("*");
      if (seriesError) throw seriesError;
      if (!seriesData) return [];

      const seriesList = seriesData as unknown as { id: string; title: string; image_url: string | null; genres: string[] }[];

      // Build genre -> series IDs map
      const genreSeriesMap = new Map<string, Set<string>>();
      for (const s of seriesList) {
        for (const g of s.genres || []) {
          if (!genreSeriesMap.has(g)) genreSeriesMap.set(g, new Set());
          genreSeriesMap.get(g)!.add(s.id);
        }
      }

      // Fetch all episodes
      const { data: episodeData, error: epError } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (epError) throw epError;
      if (!episodeData) return [];

      const episodes = episodeData as unknown as PublicEpisode[];

      // Build genre sections (only genres with episodes)
      const result: { genre: string; tagline: string; icon: string; episodes: ReturnType<typeof toEpisodeWithSeries>[] }[] = [];

      for (const [genre, seriesIds] of genreSeriesMap.entries()) {
        const genreEpisodes = episodes
          .filter((ep) => ep.series_id && seriesIds.has(ep.series_id))
          .slice(0, 20)
          .map(toEpisodeWithSeries);

        if (genreEpisodes.length > 0) {
          const { tagline, icon } = getGenreTagline(genre);
          result.push({ genre, tagline, icon, episodes: genreEpisodes });
        }
      }

      // Sort by number of episodes descending so bigger genres show first
      result.sort((a, b) => b.episodes.length - a.episodes.length);
      return result;
    },
    staleTime: 120_000,
  });
}
