
-- Add CHECK constraints for data integrity on content tables

-- series table
ALTER TABLE public.series 
  ADD CONSTRAINT series_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  ADD CONSTRAINT series_title_not_empty CHECK (length(trim(title)) > 0),
  ADD CONSTRAINT series_title_max_length CHECK (length(title) <= 200),
  ADD CONSTRAINT series_description_max_length CHECK (description IS NULL OR length(description) <= 5000);

-- episodes table
ALTER TABLE public.episodes
  ADD CONSTRAINT episodes_duration_non_negative CHECK (duration >= 0),
  ADD CONSTRAINT episodes_season_positive CHECK (season > 0),
  ADD CONSTRAINT episodes_episode_number_positive CHECK (episode_number > 0),
  ADD CONSTRAINT episodes_title_not_empty CHECK (length(trim(title)) > 0),
  ADD CONSTRAINT episodes_title_max_length CHECK (length(title) <= 200),
  ADD CONSTRAINT episodes_description_max_length CHECK (description IS NULL OR length(description) <= 5000);

-- shorts table
ALTER TABLE public.shorts
  ADD CONSTRAINT shorts_duration_non_negative CHECK (duration >= 0),
  ADD CONSTRAINT shorts_title_not_empty CHECK (length(trim(title)) > 0),
  ADD CONSTRAINT shorts_title_max_length CHECK (length(title) <= 200),
  ADD CONSTRAINT shorts_description_max_length CHECK (description IS NULL OR length(description) <= 5000);
