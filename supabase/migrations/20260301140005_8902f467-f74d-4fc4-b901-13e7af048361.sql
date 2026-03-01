-- Featured series table for admin-managed hero banner
CREATE TABLE public.featured_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(series_id)
);

-- Enable RLS
ALTER TABLE public.featured_series ENABLE ROW LEVEL SECURITY;

-- Anyone can view featured series
CREATE POLICY "Anyone can view featured series"
  ON public.featured_series
  FOR SELECT
  USING (true);

-- Admins can manage featured series
CREATE POLICY "Admins can manage featured series"
  ON public.featured_series
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
