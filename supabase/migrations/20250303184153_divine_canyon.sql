/*
  # Create affiliate_links table with UUID primary key

  1. New Tables
    - `affiliate_links`
      - `id` (uuid, primary key, auto-generated)
      - `tool_name` (text)
      - `website_url` (text)
      - `affiliate_url` (text, nullable)
      - `commission` (text, nullable)
      - `cookie_duration` (text, nullable)
      - `payout_type` (text, nullable)
      - `contact_email` (text, nullable)
      - `contact_page_url` (text, nullable)
      - `social_links` (json, array of links, nullable)
      - `outreach_status` (text, nullable)
      - `notes` (text, nullable)
      - `description` (text, nullable)
      - `category` (text, nullable)
      - `status` (text, default: "Pending")
      - `created_at` (timestamptz, auto-generated)
  
  2. Security
    - Enable RLS on `affiliate_links` table
    - Add policies for public access (select, insert, update, delete)
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS affiliate_links;

-- Create the table with the correct structure
CREATE TABLE affiliate_links (
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

-- Create indexes for better performance
CREATE INDEX idx_affiliate_links_tool_name ON affiliate_links(tool_name);
CREATE INDEX idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX idx_affiliate_links_category ON affiliate_links(category);

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
