
-- First, clean up any invalid data that isn't a valid UUID format
DELETE FROM public.watchlist 
WHERE series_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change column type from TEXT to UUID
ALTER TABLE public.watchlist 
ALTER COLUMN series_id TYPE UUID USING series_id::UUID;

-- Add proper foreign key constraint with cascading delete
ALTER TABLE public.watchlist
ADD CONSTRAINT watchlist_series_id_fkey 
FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE CASCADE;
