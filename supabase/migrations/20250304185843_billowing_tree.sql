/*
  # Create duplicate finder function

  1. New Functions
    - `find_duplicate_tools` - Finds duplicate tools based on normalized website URLs
  2. Security
    - Function is accessible to all users
*/

-- Create a function to find duplicate tools based on normalized website URLs
CREATE OR REPLACE FUNCTION public.find_duplicate_tools()
RETURNS TABLE (
  normalized_url TEXT,
  count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH normalized_urls AS (
    SELECT 
      lower(regexp_replace(
        regexp_replace(
          regexp_replace(website_url, '^https?://', ''),
          '^www\.', ''
        ),
        '/+$', ''
      )) AS normalized_url,
      id
    FROM affiliate_links
  )
  SELECT 
    normalized_url,
    COUNT(*) AS count
  FROM normalized_urls
  GROUP BY normalized_url
  HAVING COUNT(*) > 1
  ORDER BY count DESC;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.find_duplicate_tools() TO public;
