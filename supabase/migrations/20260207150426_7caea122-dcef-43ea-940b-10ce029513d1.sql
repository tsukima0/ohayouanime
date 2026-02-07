
-- Create a public view for episodes that excludes created_by
CREATE VIEW public.episodes_public
WITH (security_invoker = on) AS
  SELECT id, video_url, description, title, thumbnail_url, updated_at, created_at, duration, episode_number, season, series_id
  FROM public.episodes;

-- Create a public view for series that excludes created_by
CREATE VIEW public.series_public
WITH (security_invoker = on) AS
  SELECT id, title, description, image_url, status, genres, rating, episode_count, created_at, updated_at
  FROM public.series;

-- Create a public view for shorts that excludes created_by
CREATE VIEW public.shorts_public
WITH (security_invoker = on) AS
  SELECT id, video_url, title, description, thumbnail_url, episode_id, comments_count, likes_count, duration, created_at, updated_at
  FROM public.shorts;

-- Drop the old permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view episodes" ON public.episodes;
DROP POLICY IF EXISTS "Anyone can view series" ON public.series;
DROP POLICY IF EXISTS "Anyone can view shorts" ON public.shorts;

-- Recreate SELECT policies: public users get denied on base table, admins still have full access via their ALL/admin policies
-- For episodes: allow SELECT only for admins (they need created_by for admin panel)
CREATE POLICY "Admins can view all episodes"
  ON public.episodes
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- For series: allow SELECT only for admins
CREATE POLICY "Admins can view all series"
  ON public.series
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- For shorts: allow SELECT only for admins
CREATE POLICY "Admins can view all shorts"
  ON public.shorts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Grant SELECT on the public views to anon and authenticated roles
GRANT SELECT ON public.episodes_public TO anon, authenticated;
GRANT SELECT ON public.series_public TO anon, authenticated;
GRANT SELECT ON public.shorts_public TO anon, authenticated;
