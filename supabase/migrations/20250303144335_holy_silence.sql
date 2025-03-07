/*
  # Recreate affiliate_links table with correct schema

  1. Changes:
    - Drops the existing affiliate_links table completely
    - Creates a new affiliate_links table with the correct schema (affiliate_url as nullable)
    - Sets up all necessary indexes, RLS policies, and triggers
  
  2. This is a clean approach since we're working with test data
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS affiliate_links;

-- Create the table with the correct structure
CREATE TABLE affiliate_links (
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
CREATE INDEX idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX idx_affiliate_links_status ON affiliate_links(status);

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
