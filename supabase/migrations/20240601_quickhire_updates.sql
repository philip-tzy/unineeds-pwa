-- Create a table for freelancer skills
CREATE TABLE IF NOT EXISTS freelancer_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  tags TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for freelancer job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES freelance_jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, freelancer_id)
);

-- Create a table for customer-freelancer transactions
CREATE TABLE IF NOT EXISTS quickhire_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES freelance_jobs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  freelancer_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add autoset updated_at to freelance_jobs
CREATE OR REPLACE FUNCTION update_freelance_jobs_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS set_freelance_jobs_updated_at ON freelance_jobs;

-- Create the trigger
CREATE TRIGGER set_freelance_jobs_updated_at
BEFORE UPDATE ON freelance_jobs
FOR EACH ROW
EXECUTE FUNCTION update_freelance_jobs_modified_column();

-- Add autoset updated_at to freelancer_skills
CREATE OR REPLACE FUNCTION update_freelancer_skills_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_freelancer_skills_updated_at
BEFORE UPDATE ON freelancer_skills
FOR EACH ROW
EXECUTE FUNCTION update_freelancer_skills_modified_column();

-- Add autoset updated_at to job_applications
CREATE OR REPLACE FUNCTION update_job_applications_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_job_applications_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_modified_column();

-- Add autoset updated_at to quickhire_transactions
CREATE OR REPLACE FUNCTION update_quickhire_transactions_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_quickhire_transactions_updated_at
BEFORE UPDATE ON quickhire_transactions
FOR EACH ROW
EXECUTE FUNCTION update_quickhire_transactions_modified_column();

-- Set up RLS policies
ALTER TABLE freelancer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickhire_transactions ENABLE ROW LEVEL SECURITY;

-- freelancer_skills policies
CREATE POLICY "Freelancers can view their own skills" 
  ON freelancer_skills FOR SELECT 
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Anyone can view freelancer skills" 
  ON freelancer_skills FOR SELECT 
  USING (true);

CREATE POLICY "Freelancers can create their own skills" 
  ON freelancer_skills FOR INSERT 
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can update their own skills" 
  ON freelancer_skills FOR UPDATE 
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can delete their own skills" 
  ON freelancer_skills FOR DELETE 
  USING (auth.uid() = freelancer_id);

-- job_applications policies
CREATE POLICY "Freelancers can view their own applications" 
  ON job_applications FOR SELECT 
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Customers can view applications for their jobs" 
  ON job_applications FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM freelance_jobs 
    WHERE freelance_jobs.id = job_applications.job_id 
    AND freelance_jobs.customer_id = auth.uid()
  ));

CREATE POLICY "Freelancers can create their own applications" 
  ON job_applications FOR INSERT 
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers and job owners can update applications" 
  ON job_applications FOR UPDATE 
  USING (
    auth.uid() = freelancer_id OR
    EXISTS (
      SELECT 1 FROM freelance_jobs 
      WHERE freelance_jobs.id = job_applications.job_id 
      AND freelance_jobs.customer_id = auth.uid()
    )
  );

-- quickhire_transactions policies
CREATE POLICY "Customers can view their own transactions" 
  ON quickhire_transactions FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "Freelancers can view their own transactions" 
  ON quickhire_transactions FOR SELECT 
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Customers can create transactions" 
  ON quickhire_transactions FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update transaction status" 
  ON quickhire_transactions FOR UPDATE 
  USING (
    auth.uid() = customer_id OR
    auth.uid() = freelancer_id
  ); 