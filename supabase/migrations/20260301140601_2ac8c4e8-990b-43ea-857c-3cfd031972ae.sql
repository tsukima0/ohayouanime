-- Add custom banner image URL to featured_series
ALTER TABLE public.featured_series
ADD COLUMN banner_image_url TEXT;
