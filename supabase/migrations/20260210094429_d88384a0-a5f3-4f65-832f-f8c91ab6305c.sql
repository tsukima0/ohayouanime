
-- Fix 1: Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix 2: Remove public SELECT from base series/episodes/shorts tables
-- and recreate views WITHOUT security_invoker so they work with admin-only base table policies

-- Drop public SELECT policies on base tables
DROP POLICY IF EXISTS "Public can view series" ON public.series;
DROP POLICY IF EXISTS "Public can view episodes" ON public.episodes;
DROP POLICY IF EXISTS "Public can view shorts" ON public.shorts;

-- Recreate views without security_invoker (they'll run as view owner, bypassing RLS)
DROP VIEW IF EXISTS public.series_public;
CREATE VIEW public.series_public AS
  SELECT id, title, description, image_url, status, genres, rating, episode_count, created_at, updated_at
  FROM public.series;

DROP VIEW IF EXISTS public.episodes_public;
CREATE VIEW public.episodes_public AS
  SELECT e.id, e.title, e.description, e.thumbnail_url, e.video_url,
         e.season, e.episode_number, e.duration, e.created_at, e.updated_at,
         e.series_id, s.title AS series_title, s.image_url AS series_image_url
  FROM public.episodes e
  LEFT JOIN public.series s ON s.id = e.series_id;

DROP VIEW IF EXISTS public.shorts_public;
CREATE VIEW public.shorts_public AS
  SELECT sh.id, sh.title, sh.description, sh.thumbnail_url, sh.video_url,
         sh.duration, sh.likes_count, sh.comments_count, sh.created_at, sh.updated_at,
         sh.episode_id,
         ep.title AS episode_title,
         ep.series_id AS episode_series_id,
         s.title AS episode_series_title
  FROM public.shorts sh
  LEFT JOIN public.episodes ep ON ep.id = sh.episode_id
  LEFT JOIN public.series s ON s.id = ep.series_id;

-- Recreate short_comments_public without security_invoker
DROP VIEW IF EXISTS public.short_comments_public;
CREATE VIEW public.short_comments_public AS
  SELECT sc.id, sc.short_id, sc.text, sc.created_at,
         p.username,
         (auth.uid() = sc.user_id) AS is_own
  FROM public.short_comments sc
  LEFT JOIN public.profiles p ON p.user_id = sc.user_id;

-- Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public.series_public TO anon, authenticated;
GRANT SELECT ON public.episodes_public TO anon, authenticated;
GRANT SELECT ON public.shorts_public TO anon, authenticated;
GRANT SELECT ON public.short_comments_public TO anon, authenticated;
