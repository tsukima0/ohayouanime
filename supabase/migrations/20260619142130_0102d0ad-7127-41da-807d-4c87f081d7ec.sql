-- Private internal settings table; only service_role can read.
CREATE TABLE IF NOT EXISTS public.internal_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.internal_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_settings TO service_role;
ALTER TABLE public.internal_settings ENABLE ROW LEVEL SECURITY;
-- No policies => no access for anon/authenticated even via Data API.

-- Seed a random internal secret if not already present.
INSERT INTO public.internal_settings (key, value)
VALUES ('telegram_notify_secret', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_new_episode()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  fn_url text := 'https://tdumoncklapbzbqdjsny.supabase.co/functions/v1/telegram-notify';
  internal_secret text;
BEGIN
  SELECT value INTO internal_secret
    FROM public.internal_settings WHERE key = 'telegram_notify_secret';

  IF internal_secret IS NULL THEN
    RAISE WARNING 'notify_new_episode: telegram_notify_secret missing';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    ),
    body := jsonb_build_object('episode_id', NEW.id::text)
  );
  RETURN NEW;
END;
$function$;