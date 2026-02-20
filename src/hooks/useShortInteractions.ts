import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useShortLike(shortId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: liked = false } = useQuery({
    queryKey: ["short-like", shortId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("short_likes")
        .select("id")
        .eq("short_id", shortId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!shortId,
  });

  const { data: likesCount = 0 } = useQuery({
    queryKey: ["short-likes-count", shortId],
    queryFn: async () => {
      const { data } = await supabase
        .from("shorts_public")
        .select("likes_count")
        .eq("id", shortId)
        .maybeSingle();
      return (data as any)?.likes_count ?? 0;
    },
    enabled: !!shortId,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (liked) {
        await supabase
          .from("short_likes")
          .delete()
          .eq("short_id", shortId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("short_likes")
          .insert({ short_id: shortId, user_id: user.id });
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["short-like", shortId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ["short-likes-count", shortId] });
      const prevLiked = queryClient.getQueryData(["short-like", shortId, user?.id]);
      const prevCount = queryClient.getQueryData(["short-likes-count", shortId]);
      queryClient.setQueryData(["short-like", shortId, user?.id], !liked);
      queryClient.setQueryData(["short-likes-count", shortId], (old: number) => liked ? old - 1 : old + 1);
      return { prevLiked, prevCount };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["short-like", shortId, user?.id], context?.prevLiked);
      queryClient.setQueryData(["short-likes-count", shortId], context?.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["short-like", shortId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["short-likes-count", shortId] });
    },
  });

  return { liked, likesCount, toggleLike: toggleLike.mutate };
}

export interface DbShortComment {
  id: string;
  short_id: string;
  text: string;
  created_at: string;
  is_own: boolean;
  username: string | null;
}

export function useShortComments(shortId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["short-comments", shortId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("short_comments_public")
        .select("*")
        .eq("short_id", shortId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id ?? "",
        short_id: c.short_id ?? shortId,
        text: c.text ?? "",
        created_at: c.created_at ?? new Date().toISOString(),
        is_own: !!c.is_own,
        username: c.username ?? null,
      })) as DbShortComment[];
    },
    enabled: !!shortId,
  });

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Must be logged in");
      const trimmed = text.trim();
      if (trimmed.length === 0) throw new Error("Comment cannot be empty");
      if (trimmed.length > 1000) throw new Error("Comment cannot exceed 1000 characters");
      const { data, error } = await supabase
        .from("short_comments")
        .insert({ short_id: shortId, user_id: user.id, text: trimmed })
        .select("id, short_id, text, created_at")
        .single();
      if (error) throw error;
      return { ...data, is_own: true } as DbShortComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["short-comments-count", shortId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from("short_comments").delete().eq("id", commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["short-comments-count", shortId] });
    },
  });

  return { comments, isLoading, addComment: addComment.mutate, deleteComment: deleteComment.mutate, user };
}

export function useShortCommentsCount(shortId: string) {
  const queryClient = useQueryClient();

  const { data: commentsCount = 0 } = useQuery({
    queryKey: ["short-comments-count", shortId],
    queryFn: async () => {
      const { data } = await supabase
        .from("shorts_public")
        .select("comments_count")
        .eq("id", shortId)
        .maybeSingle();
      return (data as any)?.comments_count ?? 0;
    },
    enabled: !!shortId,
  });

  // Realtime: update count when the shorts row changes
  useEffect(() => {
    if (!shortId) return;
    const channel = supabase
      .channel(`short-comments-count-${shortId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shorts", filter: `id=eq.${shortId}` },
        (payload) => {
          const newCount = (payload.new as any)?.comments_count;
          if (typeof newCount === "number") {
            queryClient.setQueryData(["short-comments-count", shortId], newCount);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shortId, queryClient]);

  return commentsCount;
}
