-- Create missing triggers for likes and comments count updates
CREATE TRIGGER on_short_like_change
  AFTER INSERT OR DELETE ON public.short_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_short_likes_count();

CREATE TRIGGER on_short_comment_change
  AFTER INSERT OR DELETE ON public.short_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_short_comments_count();

-- Allow all users (anon + authenticated) to SELECT from shorts table
-- so realtime subscriptions work for count updates
CREATE POLICY "Anyone can view shorts"
  ON public.shorts FOR SELECT
  USING (true);