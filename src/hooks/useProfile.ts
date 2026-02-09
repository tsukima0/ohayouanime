import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const updateUsername = useMutation({
    mutationFn: async (username: string) => {
      if (!user) throw new Error("Must be logged in");
      const trimmed = username.trim();
      if (trimmed.length === 0) throw new Error("Username cannot be empty");
      if (trimmed.length > 30) throw new Error("Username must be 30 characters or less");
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) throw new Error("Username can only contain letters, numbers, and underscores");

      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmed })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return { profile, isLoading, updateUsername };
}
