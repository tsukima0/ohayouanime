import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbSeries = Tables<"series">;
export type DbEpisode = Tables<"episodes">;
export type DbShort = Tables<"shorts">;

export function useSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbSeries[];
    },
  });
}

export function useSeriesById(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["series", seriesId],
    queryFn: async () => {
      if (!seriesId) return null;
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .eq("id", seriesId)
        .maybeSingle();
      if (error) throw error;
      return data as DbSeries | null;
    },
    enabled: !!seriesId,
  });
}

export function useEpisodes() {
  return useQuery({
    queryKey: ["episodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, series:series_id(id, title, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (DbEpisode & { series: { id: string; title: string; image_url: string | null } | null })[];
    },
  });
}

export function useEpisodesBySeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["episodes", "series", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("series_id", seriesId)
        .order("season", { ascending: true })
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data as DbEpisode[];
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
        .from("episodes")
        .select("*, series:series_id(id, title, image_url)")
        .eq("id", episodeId)
        .maybeSingle();
      if (error) throw error;
      return data as (DbEpisode & { series: { id: string; title: string; image_url: string | null } | null }) | null;
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
        .from("episodes")
        .select("*, series:series_id(id, title, image_url)")
        .eq("series_id", episode.series_id)
        .or(`season.gt.${episode.season},and(season.eq.${episode.season},episode_number.gt.${episode.episode_number})`)
        .order("season", { ascending: true })
        .order("episode_number", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (DbEpisode & { series: { id: string; title: string; image_url: string | null } | null }) | null;
    },
    enabled: !!episode,
  });
}

export function useShorts() {
  return useQuery({
    queryKey: ["shorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shorts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbShort[];
    },
  });
}

export function useLatestEpisodes() {
  return useQuery({
    queryKey: ["latestEpisodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, series:series_id(id, title, image_url)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as (DbEpisode & { series: { id: string; title: string; image_url: string | null } | null })[];
    },
  });
}
