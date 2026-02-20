
-- Drop and recreate short_comments_public as a proper security definer view
-- so all users (including unauthenticated) can see all comments with username
DROP VIEW IF EXISTS public.short_comments_public;

CREATE VIEW public.short_comments_public AS
  SELECT
    sc.id,
    sc.short_id,
    sc.text,
    sc.created_at,
    p.username,
    (auth.uid() = sc.user_id) AS is_own
  FROM public.short_comments sc
  LEFT JOIN public.profiles p ON p.user_id = sc.user_id;

-- Grant public access to the view
GRANT SELECT ON public.short_comments_public TO anon, authenticated;
