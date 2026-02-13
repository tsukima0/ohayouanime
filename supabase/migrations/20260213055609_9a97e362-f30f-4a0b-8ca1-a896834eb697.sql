
-- Create subtitles table
CREATE TABLE public.subtitles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  label TEXT NOT NULL DEFAULT 'English',
  file_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage subtitles"
ON public.subtitles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view for subtitles (so unauthenticated users can load them)
CREATE VIEW public.subtitles_public WITH (security_invoker = false) AS
SELECT id, episode_id, language, label, file_url, created_at
FROM public.subtitles;

GRANT SELECT ON public.subtitles_public TO anon, authenticated;

-- Create subtitles storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('subtitles', 'subtitles', true);

-- Storage policies for subtitle files
CREATE POLICY "Subtitle files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'subtitles');

CREATE POLICY "Admins can upload subtitle files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'subtitles' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subtitle files"
ON storage.objects FOR DELETE
USING (bucket_id = 'subtitles' AND has_role(auth.uid(), 'admin'::app_role));
