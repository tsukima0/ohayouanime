import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  link_url: string | null;
  placement: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useAds(placement?: "banner" | "shorts") {
  return useQuery({
    queryKey: ["ads", placement],
    queryFn: async () => {
      let query = supabase
        .from("ads" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (placement) query = query.eq("placement", placement);
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Ad[]) ?? [];
    },
  });
}

export function useAdminAds() {
  return useQuery({
    queryKey: ["adminAds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as Ad[]) ?? [];
    },
  });
}

export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ad: { title: string; image_url: string; video_url?: string; link_url?: string; placement: string }) => {
      const { error } = await supabase.from("ads" as any).insert(ad as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads"] });
      qc.invalidateQueries({ queryKey: ["adminAds"] });
    },
  });
}

export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ad> & { id: string }) => {
      const { error } = await supabase.from("ads" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads"] });
      qc.invalidateQueries({ queryKey: ["adminAds"] });
    },
  });
}

export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads"] });
      qc.invalidateQueries({ queryKey: ["adminAds"] });
    },
  });
}
