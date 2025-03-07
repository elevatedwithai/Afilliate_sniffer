/*
  # Create affiliate_links table

  1. New Tables
    - `affiliate_links`
      - `id` (serial, primary key)
      - `tool_name` (text, not null)
      - `website_url` (text, not null)
      - `affiliate_url` (text, nullable)
      - `commission_rate` (text, nullable)
      - `cookie_duration` (text, nullable)
      - `payout_type` (text, nullable)
      - `contact_email` (text, nullable)
      - `status` (text, not null, default: 'Pending')
      - `notes` (text, nullable)
      - `created_at` (timestamptz, default: now())
      - `updated_at` (timestamptz, nullable)
  2. Security
    - Enable RLS on `affiliate_links` table
    - Add policies for authenticated users to read and write data
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);

-- Enable Row Level Security
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_links
CREATE POLICY "Allow authenticated users to select affiliate_links"
  ON affiliate_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert affiliate_links"
  ON affiliate_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update affiliate_links"
  ON affiliate_links
  FOR UPDATE
  TO authenticated
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
