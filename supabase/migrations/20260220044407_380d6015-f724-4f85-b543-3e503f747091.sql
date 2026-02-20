-- Enable realtime for shorts table so comments_count updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.shorts;