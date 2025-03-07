/*
  # Initial Schema for AI Affiliate Link Finder

  1. New Tables
    - `ai_tools`
      - `id` (serial, primary key)
      - `name` (text, not null)
      - `website` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `affiliate_programs`
      - `id` (serial, primary key)
      - `tool_id` (integer, foreign key to ai_tools.id)
      - `affiliate_url` (text, nullable)
      - `commission_rate` (text, nullable)
      - `cookie_duration` (text, nullable)
      - `program_details` (text, nullable)
      - `contact_email` (text, nullable)
      - `status` (text, default 'pending')
      - `retry_count` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and write data
*/

-- Create ai_tools table
CREATE TABLE IF NOT EXISTS ai_tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create affiliate_programs table
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id SERIAL PRIMARY KEY,
  tool_id INTEGER NOT NULL REFERENCES ai_tools(id) ON DELETE CASCADE,
  affiliate_url TEXT,
  commission_rate TEXT,
  cookie_duration TEXT,
  program_details TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_tool_id ON affiliate_programs(tool_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX IF NOT EXISTS idx_ai_tools_name ON ai_tools(name);
CREATE INDEX IF NOT EXISTS idx_ai_tools_website ON ai_tools(website);

-- Enable Row Level Security
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_tools
CREATE POLICY "Allow authenticated users to select ai_tools"
  ON ai_tools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert ai_tools"
  ON ai_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ai_tools"
  ON ai_tools
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for affiliate_programs
CREATE POLICY "Allow authenticated users to select affiliate_programs"
  ON affiliate_programs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert affiliate_programs"
  ON affiliate_programs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update affiliate_programs"
  ON affiliate_programs
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

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_ai_tools_updated_at
BEFORE UPDATE ON ai_tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_programs_updated_at
BEFORE UPDATE ON affiliate_programs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
