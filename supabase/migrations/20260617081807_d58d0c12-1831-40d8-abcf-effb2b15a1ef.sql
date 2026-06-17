CREATE OR REPLACE FUNCTION public.increment_episode_view_count(episode_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF episode_id IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.episodes SET view_count = view_count + 1 WHERE id = episode_id;
END;
$$;