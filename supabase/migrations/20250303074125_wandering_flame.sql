/*
  # Fix affiliate_url constraint

  1. Schema Updates
    - Modify `affiliate_url` column to allow NULL values
  
  2. Purpose
    - Fix error: "null value in column \"affiliate_url\" of relation \"affiliate_links\" violates not-null constraint"
    - Allow tools without affiliate programs to be properly saved
*/

-- Check if the affiliate_links table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_links'
  ) THEN
    -- Alter the affiliate_url column to allow NULL values
    ALTER TABLE affiliate_links 
    ALTER COLUMN affiliate_url DROP NOT NULL;
  END IF;
END $$;
