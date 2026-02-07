
-- Fix: Switch views from SECURITY DEFINER to SECURITY INVOKER
-- This resolves the Supabase linter error about security_definer_view
-- Step 1: Add public SELECT policies on base tables so SECURITY INVOKER views can read through them

-- Add public read policies (the admin-only SELECT policies remain but are now redundant for reads)
CREATE POLICY "Public can view episodes"
  ON public.episodes FOR SELECT
  USING (true);

CREATE POLICY "Public can view series"
  ON public.series FOR SELECT
  USING (true);

CREATE POLICY "Public can view shorts"
  ON public.shorts FOR SELECT
  USING (true);

-- Step 2: Recreate all views with security_invoker=on
DROP VIEW IF EXISTS public.episodes_public;
DROP VIEW IF EXISTS public.series_public;
DROP VIEW IF EXISTS public.shorts_public;

-- Episodes view with series info joined in (same structure, now with security_invoker)
CREATE VIEW public.episodes_public
WITH (security_invoker = on) AS
  SELECT e.id, e.video_url, e.description, e.title, e.thumbnail_url, e.updated_at, e.created_at,
         e.duration, e.episode_number, e.season, e.series_id,
         s.title as series_title, s.image_url as series_image_url
  FROM public.episodes e
  LEFT JOIN public.series s ON e.series_id = s.id;

-- Series view (excludes created_by)
CREATE VIEW public.series_public
WITH (security_invoker = on) AS
  SELECT id, title, description, image_url, status, genres, rating, episode_count, created_at, updated_at
  FROM public.series;

-- Shorts view with episode and series info joined in (excludes created_by)
CREATE VIEW public.shorts_public
WITH (security_invoker = on) AS
  SELECT sh.id, sh.video_url, sh.title, sh.description, sh.thumbnail_url, sh.episode_id,
         sh.comments_count, sh.likes_count, sh.duration, sh.created_at, sh.updated_at,
         e.title as episode_title, e.series_id as episode_series_id,
         s.title as episode_series_title
  FROM public.shorts sh
  LEFT JOIN public.episodes e ON sh.episode_id = e.id
  LEFT JOIN public.series s ON e.series_id = s.id;

-- Re-grant SELECT on views
GRANT SELECT ON public.episodes_public TO anon, authenticated;
GRANT SELECT ON public.series_public TO anon, authenticated;
GRANT SELECT ON public.shorts_public TO anon, authenticated;
