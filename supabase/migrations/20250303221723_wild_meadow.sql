/*
  # Fix commission field issue

  1. Changes
     - Ensures the commission field exists in the affiliate_links table
     - Adds any missing columns needed for the scraper to work properly
*/

-- Add missing columns to affiliate_links table if they don't exist
DO $$
BEGIN
  -- Add commission column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN commission TEXT;
  END IF;

  -- Add cookie_duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'cookie_duration'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN cookie_duration TEXT;
  END IF;

  -- Add payout_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'payout_type'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN payout_type TEXT;
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

  -- Add contact_page_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'contact_page_url'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN contact_page_url TEXT;
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

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN category TEXT;
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

-- Create indexes for the columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_outreach_status ON affiliate_links(outreach_status);
