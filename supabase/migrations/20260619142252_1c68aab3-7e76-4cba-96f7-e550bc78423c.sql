CREATE OR REPLACE FUNCTION public.admin_send_telegram_test(_episode_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  fn_url text := 'https://tdumoncklapbzbqdjsny.supabase.co/functions/v1/telegram-notify';
  internal_secret text;
  req_id bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT value INTO internal_secret
    FROM public.internal_settings WHERE key = 'telegram_notify_secret';
  IF internal_secret IS NULL THEN
    RAISE EXCEPTION 'telegram_notify_secret not configured';
  END IF;

  SELECT net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    ),
    body := jsonb_build_object('episode_id', _episode_id::text)
  ) INTO req_id;

  RETURN jsonb_build_object('ok', true, 'request_id', req_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_send_telegram_test(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_telegram_test(uuid) TO authenticated;