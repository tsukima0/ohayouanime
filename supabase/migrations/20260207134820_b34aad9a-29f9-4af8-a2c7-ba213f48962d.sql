ALTER TABLE public.shorts
  ADD COLUMN episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL;