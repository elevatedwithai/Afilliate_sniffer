/*
  # Fix affiliate_url NOT NULL constraint

  1. Changes:
    - Explicitly drop the NOT NULL constraint from the affiliate_url column
    - This migration is a direct fix for the error: "null value in column 'affiliate_url' of relation 'affiliate_links' violates not-null constraint"
*/

-- First check if the table exists and if the column has a NOT NULL constraint
DO $$
BEGIN
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
END $$;
