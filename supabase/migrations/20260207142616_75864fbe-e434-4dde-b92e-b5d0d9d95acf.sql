-- Add length constraint on short_comments text to prevent abuse
-- Using a validation trigger instead of CHECK constraint for flexibility

CREATE OR REPLACE FUNCTION public.validate_comment_text()
RETURNS TRIGGER AS $$
BEGIN
  IF length(trim(NEW.text)) = 0 THEN
    RAISE EXCEPTION 'Comment text cannot be empty';
  END IF;
  IF length(NEW.text) > 1000 THEN
    RAISE EXCEPTION 'Comment text cannot exceed 1000 characters';
  END IF;
  -- Trim whitespace
  NEW.text := trim(NEW.text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_comment_text_trigger
  BEFORE INSERT OR UPDATE ON public.short_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_comment_text();