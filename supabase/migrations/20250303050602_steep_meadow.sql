/*
  # Fix Row Level Security Policies

  1. Changes
    - Add anonymous access to affiliate_links table
    - Fix existing RLS policies to allow both authenticated and anonymous users
    - Ensure all operations (SELECT, INSERT, UPDATE, DELETE) are properly permitted
  
  2. Security
    - Enable public access to the affiliate_links table
    - This is necessary for the application to function without authentication
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policies for affiliate_links
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow authenticated users to select affiliate_links') THEN
    DROP POLICY "Allow authenticated users to select affiliate_links" ON affiliate_links;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow authenticated users to insert affiliate_links') THEN
    DROP POLICY "Allow authenticated users to insert affiliate_links" ON affiliate_links;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow authenticated users to update affiliate_links') THEN
    DROP POLICY "Allow authenticated users to update affiliate_links" ON affiliate_links;
  END IF;
END $$;

-- Create new policies that allow both authenticated and anonymous access
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
