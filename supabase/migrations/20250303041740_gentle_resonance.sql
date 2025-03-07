/*
  # Fix duplicate policies

  This migration checks if objects exist before creating them to avoid conflicts
  with existing database objects.
*/

-- Create ai_tools table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create affiliate_programs table if it doesn't exist
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

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_tool_id ON affiliate_programs(tool_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX IF NOT EXISTS idx_ai_tools_name ON ai_tools(name);
CREATE INDEX IF NOT EXISTS idx_ai_tools_website ON ai_tools(website);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  EXECUTE 'ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create policies for ai_tools if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_tools' AND policyname = 'Allow authenticated users to select ai_tools'
  ) THEN
    CREATE POLICY "Allow authenticated users to select ai_tools"
      ON ai_tools
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_tools' AND policyname = 'Allow authenticated users to insert ai_tools'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert ai_tools"
      ON ai_tools
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_tools' AND policyname = 'Allow authenticated users to update ai_tools'
  ) THEN
    CREATE POLICY "Allow authenticated users to update ai_tools"
      ON ai_tools
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create policies for affiliate_programs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_programs' AND policyname = 'Allow authenticated users to select affiliate_programs'
  ) THEN
    CREATE POLICY "Allow authenticated users to select affiliate_programs"
      ON affiliate_programs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_programs' AND policyname = 'Allow authenticated users to insert affiliate_programs'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert affiliate_programs"
      ON affiliate_programs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_programs' AND policyname = 'Allow authenticated users to update affiliate_programs'
  ) THEN
    CREATE POLICY "Allow authenticated users to update affiliate_programs"
      ON affiliate_programs
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_tools_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_tools_updated_at
    BEFORE UPDATE ON ai_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_affiliate_programs_updated_at'
  ) THEN
    CREATE TRIGGER update_affiliate_programs_updated_at
    BEFORE UPDATE ON affiliate_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
