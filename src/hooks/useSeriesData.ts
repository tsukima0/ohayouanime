import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbSeries = Tables<"series">;
export type DbEpisode = Tables<"episodes">;
export type DbShort = Tables<"shorts">;

// Public series type (excludes created_by)
export interface PublicSeries {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  genres: string[];
  rating: number | null;
  episode_count: number;
  created_at: string;
  updated_at: string;
}

// Public episode type with joined series info (excludes created_by)
export interface PublicEpisode {
  id: string;
  video_url: string | null;
  description: string | null;
  title: string;
  thumbnail_url: string | null;
  updated_at: string;
  created_at: string;
  duration: number;
  episode_number: number;
  season: number;
  series_id: string;
  series_title: string | null;
  series_image_url: string | null;
}

// Public short type with joined episode/series info (excludes created_by)
export interface PublicShort {
  id: string;
  video_url: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  episode_id: string | null;
  comments_count: number;
  likes_count: number;
  duration: number;
  created_at: string;
  updated_at: string;
  episode_title: string | null;
  episode_series_id: string | null;
  episode_series_title: string | null;
}

// Helper to convert PublicEpisode to the shape components expect
function toEpisodeWithSeries(ep: PublicEpisode) {
  return {
    id: ep.id,
    video_url: ep.video_url,
    description: ep.description,
    title: ep.title,
    thumbnail_url: ep.thumbnail_url,
    updated_at: ep.updated_at,
    created_at: ep.created_at,
    created_by: null,
    duration: ep.duration,
    episode_number: ep.episode_number,
    season: ep.season,
    series_id: ep.series_id,
    series: ep.series_title
      ? { id: ep.series_id, title: ep.series_title, image_url: ep.series_image_url }
      : null,
  };
}

export function useSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PublicSeries[];
    },
  });
}

export function useSeriesById(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["series", seriesId],
    queryFn: async () => {
      if (!seriesId) return null;
      const { data, error } = await supabase
        .from("series_public" as any)
        .select("*")
        .eq("id", seriesId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PublicSeries | null;
    },
    enabled: !!seriesId,
  });
}

export function useEpisodes() {
  return useQuery({
    queryKey: ["episodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as PublicEpisode[]).map(toEpisodeWithSeries);
    },
  });
}

export function useEpisodesBySeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["episodes", "series", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .eq("series_id", seriesId)
        .order("season", { ascending: true })
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return (data as unknown as PublicEpisode[]).map((ep) => ({
        id: ep.id,
        video_url: ep.video_url,
        description: ep.description,
        title: ep.title,
        thumbnail_url: ep.thumbnail_url,
        updated_at: ep.updated_at,
        created_at: ep.created_at,
        created_by: null,
        duration: ep.duration,
        episode_number: ep.episode_number,
        season: ep.season,
        series_id: ep.series_id,
      })) as DbEpisode[];
    },
    enabled: !!seriesId,
  });
}

export function useEpisodeById(episodeId: string | undefined) {
  return useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      if (!episodeId) return null;
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .eq("id", episodeId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toEpisodeWithSeries(data as unknown as PublicEpisode);
    },
    enabled: !!episodeId,
  });
}

export function useNextEpisode(episode: DbEpisode | null | undefined) {
  return useQuery({
    queryKey: ["nextEpisode", episode?.id],
    queryFn: async () => {
      if (!episode) return null;
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .eq("series_id", episode.series_id)
        .or(`season.gt.${episode.season},and(season.eq.${episode.season},episode_number.gt.${episode.episode_number})`)
        .order("season", { ascending: true })
        .order("episode_number", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toEpisodeWithSeries(data as unknown as PublicEpisode);
    },
    enabled: !!episode,
  });
}

export type ShortWithEpisode = DbShort & {
  episode: { id: string; title: string; series_id: string; series: { title: string } | null } | null;
};

export function useShorts() {
  return useQuery({
    queryKey: ["shorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shorts_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Transform to the shape components expect
      return (data as unknown as PublicShort[]).map((sh) => ({
        id: sh.id,
        video_url: sh.video_url,
        title: sh.title,
        description: sh.description,
        thumbnail_url: sh.thumbnail_url,
        episode_id: sh.episode_id,
        comments_count: sh.comments_count,
        likes_count: sh.likes_count,
        duration: sh.duration,
        created_at: sh.created_at,
        updated_at: sh.updated_at,
        created_by: null,
        episode: sh.episode_id
          ? {
              id: sh.episode_id,
              title: sh.episode_title || "",
              series_id: sh.episode_series_id || "",
              series: sh.episode_series_title ? { title: sh.episode_series_title } : null,
            }
          : null,
      })) as ShortWithEpisode[];
    },
  });
}

export function useLatestEpisodes() {
  return useQuery({
    queryKey: ["latestEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes_public" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data as unknown as PublicEpisode[]).map(toEpisodeWithSeries);
    },
  });
}
