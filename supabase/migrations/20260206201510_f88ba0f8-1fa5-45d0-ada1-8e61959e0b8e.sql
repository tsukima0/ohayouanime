
-- Create watchlist table for users to save series
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
  ON public.watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can add to their own watchlist"
  ON public.watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own watchlist
CREATE POLICY "Users can remove from their own watchlist"
  ON public.watchlist
  FOR DELETE
  USING (auth.uid() = user_id);
