/*
  # Update RLS policies for affiliate_links table

  1. Changes
     - Drop existing policies if they exist
     - Create new public policies that allow anonymous access only if they don't exist
     - Enable public access for SELECT, INSERT, UPDATE, and DELETE operations

  2. Security
     - This makes the affiliate_links table publicly accessible
     - Appropriate for this application where data isn't sensitive
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

-- Create new policies that allow both authenticated and anonymous access, but only if they don't exist
DO $$
BEGIN
  -- Check if policies already exist before creating them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow public select on affiliate_links') THEN
    CREATE POLICY "Allow public select on affiliate_links"
      ON affiliate_links
      FOR SELECT
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow public insert on affiliate_links') THEN
    CREATE POLICY "Allow public insert on affiliate_links"
      ON affiliate_links
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow public update on affiliate_links') THEN
    CREATE POLICY "Allow public update on affiliate_links"
      ON affiliate_links
      FOR UPDATE
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Allow public delete on affiliate_links') THEN
    CREATE POLICY "Allow public delete on affiliate_links"
      ON affiliate_links
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
