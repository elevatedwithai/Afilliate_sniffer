/*
  # Update affiliate_links table

  1. Changes
    - Ensures the affiliate_links table exists with all required columns
    - Adds indexes for better performance if they don't exist
    - Checks for existing policies before creating them
  
  2. Security
    - Ensures RLS is enabled on the affiliate_links table
    - Ensures all necessary policies exist for public access
*/

-- Create the table with the correct structure if it doesn't exist
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  affiliate_url TEXT,
  commission TEXT,
  cookie_duration TEXT,
  payout_type TEXT,
  contact_email TEXT,
  contact_page_url TEXT,
  social_links JSONB,
  outreach_status TEXT,
  notes TEXT,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON affiliate_links(category);

-- Enable Row Level Security
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create policies for public access only if they don't exist
DO $$
BEGIN
  -- Check if policies already exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_links' 
    AND policyname = 'Allow public select on affiliate_links'
  ) THEN
    CREATE POLICY "Allow public select on affiliate_links"
      ON affiliate_links
      FOR SELECT
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_links' 
    AND policyname = 'Allow public insert on affiliate_links'
  ) THEN
    CREATE POLICY "Allow public insert on affiliate_links"
      ON affiliate_links
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_links' 
    AND policyname = 'Allow public update on affiliate_links'
  ) THEN
    CREATE POLICY "Allow public update on affiliate_links"
      ON affiliate_links
      FOR UPDATE
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliate_links' 
    AND policyname = 'Allow public delete on affiliate_links'
  ) THEN
    CREATE POLICY "Allow public delete on affiliate_links"
      ON affiliate_links
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
