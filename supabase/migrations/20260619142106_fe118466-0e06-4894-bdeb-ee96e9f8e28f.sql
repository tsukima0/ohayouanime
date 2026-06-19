CREATE OR REPLACE FUNCTION public.notify_new_episode()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  fn_url text := 'https://tdumoncklapbzbqdjsny.supabase.co/functions/v1/telegram-notify';
  service_key text;
BEGIN
  -- Read service role key from a database-level setting so it isn't hardcoded.
  -- Set once with: ALTER DATABASE postgres SET app.service_role_key = '...';
  BEGIN
    service_key := current_setting('app.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    service_key := NULL;
  END;

  IF service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'notify_new_episode: app.service_role_key not configured; skipping Telegram notify';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('episode_id', NEW.id::text)
  );
  RETURN NEW;
END;
$function$;