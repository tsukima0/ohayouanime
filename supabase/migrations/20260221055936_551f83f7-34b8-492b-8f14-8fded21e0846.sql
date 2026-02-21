-- Make trigger functions SECURITY DEFINER so they can update shorts table regardless of caller's role
CREATE OR REPLACE FUNCTION public.update_short_likes_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET likes_count = likes_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET likes_count = likes_count - 1 WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_short_comments_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shorts SET comments_count = comments_count + 1 WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shorts SET comments_count = comments_count - 1 WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
END;
$$;