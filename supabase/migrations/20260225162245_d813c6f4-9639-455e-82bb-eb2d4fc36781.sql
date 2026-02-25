
-- Ads table for banner ads and shorts ads
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  placement text NOT NULL DEFAULT 'banner', -- 'banner' or 'shorts'
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ads
CREATE POLICY "Anyone can view active ads"
ON public.ads FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage ads"
ON public.ads FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Public view for ads (excludes created_by)
CREATE VIEW public.ads_public AS
SELECT id, title, image_url, link_url, placement, is_active, sort_order, created_at, updated_at
FROM public.ads
WHERE is_active = true;
