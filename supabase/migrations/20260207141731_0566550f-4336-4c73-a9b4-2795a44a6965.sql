-- Drop the overly permissive public SELECT policy on short_likes
DROP POLICY IF EXISTS "Anyone can view short likes" ON public.short_likes;

-- Create a new policy that only allows users to see their own likes
CREATE POLICY "Users can view their own likes"
ON public.short_likes
FOR SELECT
USING (auth.uid() = user_id);