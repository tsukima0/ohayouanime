
-- Update handle_new_user to read username from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username')
  ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username);
  RETURN NEW;
END;
$$;
