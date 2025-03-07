/*
  # Fix affiliate_links table and policies

  1. Table Updates
    - Ensure `affiliate_links` table exists with proper columns
    - Add `updated_at` column with trigger for automatic updates
  
  2. Security
    - Ensure RLS is enabled
    - Check for existing policies before creating new ones
*/

-- Create affiliate_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  affiliate_url TEXT,
  commission_rate TEXT,
  cookie_duration TEXT,
  payout_type TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);

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

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_affiliate_links_updated_at'
  ) THEN
    CREATE TRIGGER update_affiliate_links_updated_at
    BEFORE UPDATE ON affiliate_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
