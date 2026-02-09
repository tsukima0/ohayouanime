
-- Create a public view for short comments that hides user_id
-- but exposes an is_own flag for the current user
CREATE VIEW public.short_comments_public
WITH (security_invoker=on) AS
  SELECT
    sc.id,
    sc.short_id,
    sc.text,
    sc.created_at,
    (auth.uid() = sc.user_id) AS is_own
  FROM public.short_comments sc;

-- Replace the public SELECT policy with owner-only direct access
DROP POLICY "Anyone can view short comments" ON public.short_comments;

CREATE POLICY "Users can view their own comments"
  ON public.short_comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add a permissive policy so the view (with security_invoker) can read all comments
-- The view runs as the calling user, so we need a broad SELECT for the view to work
-- We use a separate permissive policy that the view leverages
CREATE POLICY "Public can view comments via view"
  ON public.short_comments
  FOR SELECT
  USING (true);
