/*
  # Add features column to affiliate_links table

  1. Changes
    - Add features column as TEXT[] array to store product features
*/

-- Add features column if it doesn't exist
DO $$
BEGIN
  -- Add features column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'features'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN features TEXT[];
  END IF;
END $$;
