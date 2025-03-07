/*
  # Add missing columns to affiliate_links table

  1. Changes
     - Add missing columns to the affiliate_links table:
       - category
       - outreach_status
       - social_links
       - contact_page_url
       - description
     - Create indexes for new columns

  2. Security
     - No changes to RLS policies
*/

-- Add missing columns to affiliate_links table if they don't exist
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN category TEXT;
  END IF;

  -- Add outreach_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'outreach_status'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN outreach_status TEXT DEFAULT 'Needs Contact';
  END IF;

  -- Add social_links column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'social_links'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN social_links JSONB;
  END IF;

  -- Add contact_page_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'contact_page_url'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN contact_page_url TEXT;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_outreach_status ON affiliate_links(outreach_status);
