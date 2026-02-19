-- Add view_count to episodes table
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION public.increment_episode_view_count(episode_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.episodes SET view_count = view_count + 1 WHERE id = episode_id;
$$;