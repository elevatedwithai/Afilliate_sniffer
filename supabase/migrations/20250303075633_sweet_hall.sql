/*
  # Final database schema fix

  1. Changes
     - Recreate affiliate_links table with nullable affiliate_url
     - Ensure all RLS policies are properly set
     - Restore any existing data
  
  2. Security
     - Enable RLS on affiliate_links table
     - Add policies for public access
*/

-- Create a backup table if it doesn't exist
CREATE TABLE IF NOT EXISTS affiliate_links_backup AS 
SELECT * FROM affiliate_links WHERE 1=0;

-- Copy data to backup if the main table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_links'
  ) THEN
    -- Clear backup table first
    DELETE FROM affiliate_links_backup;
    
    -- Copy data to backup
    INSERT INTO affiliate_links_backup
    SELECT * FROM affiliate_links;
    
    -- Drop the existing table
    DROP TABLE affiliate_links;
  END IF;
END $$;

-- Create the table with the correct structure
CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  affiliate_url TEXT, -- Explicitly nullable
  commission_rate TEXT,
  cookie_duration TEXT,
  payout_type TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);

-- Enable Row Level Security
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_affiliate_links_updated_at
BEFORE UPDATE ON affiliate_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Restore data from backup if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_links_backup'
  ) AND (SELECT COUNT(*) FROM affiliate_links_backup) > 0 THEN
    -- Insert data from backup
    INSERT INTO affiliate_links (
      id, tool_name, website_url, affiliate_url, commission_rate, 
      cookie_duration, payout_type, contact_email, status, notes, 
      created_at, updated_at
    )
    SELECT 
      id, tool_name, website_url, affiliate_url, commission_rate, 
      cookie_duration, payout_type, contact_email, status, notes, 
      created_at, updated_at
    FROM affiliate_links_backup;

    -- Reset the sequence to the max id
    PERFORM setval(
      pg_get_serial_sequence('affiliate_links', 'id'),
      COALESCE((SELECT MAX(id) FROM affiliate_links), 1),
      false
    );
  END IF;
END $$;
