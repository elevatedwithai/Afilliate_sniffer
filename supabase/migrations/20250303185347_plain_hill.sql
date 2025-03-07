/*
  # Add missing columns to affiliate_links table

  1. Changes
    - Adds missing columns to the affiliate_links table:
      - Renames commission_rate to commission if needed
      - Adds outreach_status column if it doesn't exist
      - Adds category column if it doesn't exist
  
  2. Security
    - No security changes
*/

-- Check if columns exist and add them if they don't
DO $$
BEGIN
  -- Check if commission column exists, if not rename commission_rate to commission
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission_rate'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission'
  ) THEN
    ALTER TABLE affiliate_links RENAME COLUMN commission_rate TO commission;
  END IF;

  -- Add commission column if neither commission nor commission_rate exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN commission TEXT;
  END IF;

  -- Add outreach_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'outreach_status'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN outreach_status TEXT;
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
END $$;
