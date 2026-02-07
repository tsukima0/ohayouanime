
-- Create short_likes table
CREATE TABLE public.short_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(short_id, user_id)
);

ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view short likes" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like shorts" ON public.short_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.short_likes FOR DELETE USING (auth.uid() = user_id);

-- Create short_comments table
CREATE TABLE public.short_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id UUID NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view short comments" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.short_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.short_comments FOR DELETE USING (auth.uid() = user_id);

-- Add likes_count to shorts for quick access
ALTER TABLE public.shorts ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.shorts ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_short_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET likes_count = likes_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET likes_count = likes_count - 1 WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_short_likes_count_trigger
AFTER INSERT OR DELETE ON public.short_likes
FOR EACH ROW EXECUTE FUNCTION public.update_short_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_short_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET comments_count = comments_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET comments_count = comments_count - 1 WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_short_comments_count_trigger
AFTER INSERT OR DELETE ON public.short_comments
FOR EACH ROW EXECUTE FUNCTION public.update_short_comments_count();
