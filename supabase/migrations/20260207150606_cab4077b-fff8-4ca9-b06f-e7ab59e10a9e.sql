
-- Recreate views WITHOUT security_invoker so they bypass RLS on base tables
-- This is safe because the views only expose non-sensitive columns (no created_by)

DROP VIEW IF EXISTS public.episodes_public;
DROP VIEW IF EXISTS public.series_public;
DROP VIEW IF EXISTS public.shorts_public;

CREATE VIEW public.episodes_public AS
  SELECT id, video_url, description, title, thumbnail_url, updated_at, created_at, duration, episode_number, season, series_id
  FROM public.episodes;

CREATE VIEW public.series_public AS
  SELECT id, title, description, image_url, status, genres, rating, episode_count, created_at, updated_at
  FROM public.series;

CREATE VIEW public.shorts_public AS
  SELECT id, video_url, title, description, thumbnail_url, episode_id, comments_count, likes_count, duration, created_at, updated_at
  FROM public.shorts;

-- Grant SELECT on views to anon and authenticated
GRANT SELECT ON public.episodes_public TO anon, authenticated;
GRANT SELECT ON public.series_public TO anon, authenticated;
GRANT SELECT ON public.shorts_public TO anon, authenticated;
