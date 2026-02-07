
-- 1. RBAC: Role enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: Only admins can manage roles, users can read their own
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Series table
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,1) DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing',
  episode_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series"
  ON public.series FOR SELECT USING (true);

CREATE POLICY "Admins can insert series"
  ON public.series FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update series"
  ON public.series FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete series"
  ON public.series FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  season INT NOT NULL DEFAULT 1,
  episode_number INT NOT NULL DEFAULT 1,
  duration INT NOT NULL DEFAULT 0,
  video_url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view episodes"
  ON public.episodes FOR SELECT USING (true);

CREATE POLICY "Admins can insert episodes"
  ON public.episodes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update episodes"
  ON public.episodes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete episodes"
  ON public.episodes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Shorts table
CREATE TABLE public.shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shorts"
  ON public.shorts FOR SELECT USING (true);

CREATE POLICY "Admins can insert shorts"
  ON public.shorts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shorts"
  ON public.shorts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shorts"
  ON public.shorts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shorts_updated_at
  BEFORE UPDATE ON public.shorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Auto-update episode_count on series
CREATE OR REPLACE FUNCTION public.update_episode_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.series SET episode_count = (
      SELECT COUNT(*) FROM public.episodes WHERE series_id = OLD.series_id
    ) WHERE id = OLD.series_id;
    RETURN OLD;
  ELSE
    UPDATE public.series SET episode_count = (
      SELECT COUNT(*) FROM public.episodes WHERE series_id = NEW.series_id
    ) WHERE id = NEW.series_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_series_episode_count
  AFTER INSERT OR DELETE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_episode_count();

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies: public read, admin write
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Admins can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));
