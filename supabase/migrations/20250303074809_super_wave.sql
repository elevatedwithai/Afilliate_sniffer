/*
  # Fix affiliate_url constraint

  1. Changes
     - Modify affiliate_url column to allow NULL values
     - This fixes the "null value in column affiliate_url violates not-null constraint" error

  2. Reason
     - When no affiliate program is found, we need to store NULL in the affiliate_url column
     - This allows us to properly track tools where no affiliate program was found
*/

-- Check if the affiliate_links table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_links'
  ) THEN
    -- Check if affiliate_url column has NOT NULL constraint
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'affiliate_links'
      AND column_name = 'affiliate_url'
      AND is_nullable = 'NO'
    ) THEN
      -- Alter the affiliate_url column to allow NULL values
      ALTER TABLE affiliate_links 
      ALTER COLUMN affiliate_url DROP NOT NULL;
    END IF;
  END IF;
END $$;
