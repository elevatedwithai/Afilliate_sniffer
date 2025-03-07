/*
  # Disable unique constraint on website_url

  1. Changes
    - Drops the unique index on website_url to allow duplicate entries
  2. Purpose
    - Allows bulk importing tools without duplicate checking
*/

-- Drop the unique index on website_url if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'affiliate_links' 
    AND indexname = 'idx_affiliate_links_website_url_unique'
  ) THEN
    DROP INDEX idx_affiliate_links_website_url_unique;
  END IF;
END $$;

-- Create a non-unique index for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_website_url 
ON affiliate_links (lower(website_url));
