
-- Drop the current view and recreate WITHOUT security_invoker
-- This way the view bypasses RLS on the base table (can read all rows)
-- but auth.uid() still works as a session function for the is_own column
DROP VIEW IF EXISTS public.short_comments_public;

CREATE VIEW public.short_comments_public AS
  SELECT
    sc.id,
    sc.short_id,
    sc.text,
    sc.created_at,
    (auth.uid() = sc.user_id) AS is_own
  FROM public.short_comments sc;

-- Remove the broad public SELECT policy (this was the security hole)
DROP POLICY IF EXISTS "Public can view comments via view" ON public.short_comments;

-- Keep "Users can view their own comments" so direct table queries
-- only return the user's own comments (needed for INSERT/DELETE operations)
-- The view bypasses RLS so it can still read all comments
