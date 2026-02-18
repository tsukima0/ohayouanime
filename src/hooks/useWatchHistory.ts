import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WatchHistoryEntry {
  id: string;
  episode_id: string;
  watched_seconds: number;
  duration: number;
  completed: boolean;
  updated_at: string;
}

export function useWatchHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchHistory", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as WatchHistoryEntry[];
    },
    enabled: !!user,
  });
}

export function useUpsertWatchHistory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      episodeId,
      watchedSeconds,
      duration,
    }: {
      episodeId: string;
      watchedSeconds: number;
      duration: number;
    }) => {
      if (!user) return;
      const completed = duration > 0 && watchedSeconds / duration >= 0.9;
      const { error } = await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          episode_id: episodeId,
          watched_seconds: watchedSeconds,
          duration,
          completed,
        },
        { onConflict: "user_id,episode_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchHistory", user?.id] });
    },
  });
}
