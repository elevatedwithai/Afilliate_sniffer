/*
  # Fix schema issues and improve data handling

  1. Schema Fixes
    - Ensure all columns exist with correct types
    - Add indexes for better performance
    - Fix any potential RLS issues
  
  2. Data Integrity
    - Add constraints to prevent duplicate entries
    - Add validation functions
*/

-- First, ensure all required columns exist with correct types
DO $$
BEGIN
  -- Rename commission_rate to commission if it exists and commission doesn't
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

  -- Add commission column if neither exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN commission TEXT;
  END IF;

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

  -- Add features column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'features'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN features TEXT[];
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

  -- Add outreach_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'affiliate_links'
    AND column_name = 'outreach_status'
  ) THEN
    ALTER TABLE affiliate_links ADD COLUMN outreach_status TEXT DEFAULT 'Needs Contact';
  END IF;
END $$;

-- Create a unique index on website_url to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'affiliate_links' 
    AND indexname = 'idx_affiliate_links_website_url_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_affiliate_links_website_url_unique 
    ON affiliate_links ((lower(website_url)));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tags ON affiliate_links USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_use_cases ON affiliate_links USING gin (use_cases);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_features ON affiliate_links USING gin (features);

-- Ensure RLS policies are correctly set
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to recreate them
  DROP POLICY IF EXISTS "Allow public select on affiliate_links" ON affiliate_links;
  DROP POLICY IF EXISTS "Allow public insert on affiliate_links" ON affiliate_links;
  DROP POLICY IF EXISTS "Allow public update on affiliate_links" ON affiliate_links;
  DROP POLICY IF EXISTS "Allow public delete on affiliate_links" ON affiliate_links;
  
  -- Create new policies
  CREATE POLICY "Allow public select on affiliate_links"
    ON affiliate_links
    FOR SELECT
    TO public
    USING (true);
  
  CREATE POLICY "Allow public insert on affiliate_links"
    ON affiliate_links
    FOR INSERT
    TO public
    WITH CHECK (true);
  
  CREATE POLICY "Allow public update on affiliate_links"
    ON affiliate_links
    FOR UPDATE
    TO public
    USING (true);
  
  CREATE POLICY "Allow public delete on affiliate_links"
    ON affiliate_links
    FOR DELETE
    TO public
    USING (true);
END $$;

-- Create a function to normalize website URLs for comparison
CREATE OR REPLACE FUNCTION normalize_website_url(url TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Remove protocol, www, and trailing slashes
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(url, '^https?://', ''),
      '^www\.', ''
    ),
    '/+$', ''
  ));
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to normalize website URLs before insert/update
CREATE OR REPLACE FUNCTION normalize_website_url_trigger() 
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure website_url starts with http:// or https://
  IF NEW.website_url IS NOT NULL AND NOT (NEW.website_url ~* '^https?://') THEN
    NEW.website_url := 'https://' || NEW.website_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS normalize_website_url_trigger ON affiliate_links;
CREATE TRIGGER normalize_website_url_trigger
BEFORE INSERT OR UPDATE ON affiliate_links
FOR EACH ROW
EXECUTE FUNCTION normalize_website_url_trigger();
