-- Transaction management functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- Begin a transaction
  -- This is a dummy function as Supabase transactions are handled
  -- by the client, but having this function makes the code cleaner
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- Commit a transaction
  -- This is a dummy function as Supabase transactions are handled
  -- by the client, but having this function makes the code cleaner
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Rollback a transaction
  -- This is a dummy function as Supabase transactions are handled
  -- by the client, but having this function makes the code cleaner
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the freelance_jobs table if it doesn't exist already
CREATE TABLE IF NOT EXISTS freelance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  skills_required TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  service_type TEXT NOT NULL DEFAULT 'quickhire',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add RLS policies for freelance_jobs if they don't exist
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE freelance_jobs ENABLE ROW LEVEL SECURITY;
  
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'freelance_jobs' AND policyname = 'Customers can create jobs'
  ) THEN
    CREATE POLICY "Customers can create jobs" 
      ON freelance_jobs FOR INSERT 
      WITH CHECK (auth.uid() = customer_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'freelance_jobs' AND policyname = 'Customers can view their own jobs'
  ) THEN
    CREATE POLICY "Customers can view their own jobs" 
      ON freelance_jobs FOR SELECT 
      USING (auth.uid() = customer_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'freelance_jobs' AND policyname = 'Freelancers can view available jobs'
  ) THEN
    CREATE POLICY "Freelancers can view available jobs" 
      ON freelance_jobs FOR SELECT 
      USING (status = 'open' OR freelancer_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'freelance_jobs' AND policyname = 'Customers can update their own jobs'
  ) THEN
    CREATE POLICY "Customers can update their own jobs" 
      ON freelance_jobs FOR UPDATE 
      USING (auth.uid() = customer_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'freelance_jobs' AND policyname = 'Freelancers can update assigned jobs'
  ) THEN
    CREATE POLICY "Freelancers can update assigned jobs" 
      ON freelance_jobs FOR UPDATE 
      USING (auth.uid() = freelancer_id);
  END IF;
END
$$; 