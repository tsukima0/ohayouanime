
ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS audio_language text NOT NULL DEFAULT 'Japanese',
  ADD COLUMN IF NOT EXISTS subtitle_language text NOT NULL DEFAULT 'Burmese';

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_episode()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://tdumoncklapbzbqdjsny.supabase.co/functions/v1/telegram-notify';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdW1vbmNrbGFwYnpicWRqc255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc1NzQsImV4cCI6MjA4NTk4MzU3NH0.iLzmsABaeOkmVpGC22rXZ3FPE56oiuc4db5xqwvFuQQ';
BEGIN
  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('episode_id', NEW.id::text)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_episode ON public.episodes;
CREATE TRIGGER trg_notify_new_episode
AFTER INSERT ON public.episodes
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_episode();
