
-- Fix ads_public view to use SECURITY INVOKER
DROP VIEW IF EXISTS public.ads_public;
CREATE VIEW public.ads_public WITH (security_invoker = true) AS
SELECT id, title, image_url, link_url, placement, is_active, sort_order, created_at, updated_at
FROM public.ads
WHERE is_active = true;
