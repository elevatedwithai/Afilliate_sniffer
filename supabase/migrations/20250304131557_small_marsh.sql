/*
  # Add enhanced fields to affiliate_links table
  
  1. New Columns
    - `tags` (text array) - Store tags related to the tool
    - `use_cases` (text array) - Store use cases for the tool
    - `favicon_url` (text) - URL to the tool's favicon
    - `logo_url` (text) - URL to the tool's logo
    - `image_url` (text) - URL to a product image
  
  2. Changes
    - Adds new columns for enhanced data collection
    - Ensures all new columns are nullable
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN tags TEXT[];
  END IF;

  -- Add use_cases column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'use_cases'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN use_cases TEXT[];
  END IF;

  -- Add favicon_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'favicon_url'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN favicon_url TEXT;
  END IF;

  -- Add logo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN logo_url TEXT;
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN image_url TEXT;
  END IF;
END $$;
