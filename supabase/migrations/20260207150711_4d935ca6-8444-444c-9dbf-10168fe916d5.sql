
-- Recreate views with built-in joins for the data the app needs
DROP VIEW IF EXISTS public.episodes_public;
DROP VIEW IF EXISTS public.shorts_public;

-- Episodes view with series info joined in
CREATE VIEW public.episodes_public AS
  SELECT e.id, e.video_url, e.description, e.title, e.thumbnail_url, e.updated_at, e.created_at,
         e.duration, e.episode_number, e.season, e.series_id,
         s.title as series_title, s.image_url as series_image_url
  FROM public.episodes e
  LEFT JOIN public.series s ON e.series_id = s.id;

-- Shorts view with episode and series info joined in
CREATE VIEW public.shorts_public AS
  SELECT sh.id, sh.video_url, sh.title, sh.description, sh.thumbnail_url, sh.episode_id,
         sh.comments_count, sh.likes_count, sh.duration, sh.created_at, sh.updated_at,
         e.title as episode_title, e.series_id as episode_series_id,
         s.title as episode_series_title
  FROM public.shorts sh
  LEFT JOIN public.episodes e ON sh.episode_id = e.id
  LEFT JOIN public.series s ON e.series_id = s.id;

GRANT SELECT ON public.episodes_public TO anon, authenticated;
GRANT SELECT ON public.shorts_public TO anon, authenticated;
