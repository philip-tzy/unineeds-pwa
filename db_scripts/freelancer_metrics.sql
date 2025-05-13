-- Create freelancer_metrics table to store consolidated metrics
CREATE TABLE IF NOT EXISTS freelancer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  available_balance DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(freelancer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freelancer_metrics_freelancer_id 
  ON freelancer_metrics(freelancer_id);

-- Enable RLS on the freelancer_metrics table
ALTER TABLE freelancer_metrics ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for the freelancer_metrics table
CREATE POLICY freelancer_metrics_select ON freelancer_metrics
  FOR SELECT USING (auth.uid() = freelancer_id OR 
                   auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY freelancer_metrics_update ON freelancer_metrics
  FOR UPDATE USING (auth.uid() = freelancer_id OR 
                   auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE freelancer_metrics;

-- Create a function to calculate and update freelancer metrics
CREATE OR REPLACE FUNCTION update_freelancer_metrics(
  p_freelancer_id UUID
) RETURNS VOID AS $$
DECLARE
  v_active_jobs INTEGER;
  v_completed_jobs INTEGER;
  v_total_earnings DECIMAL(10, 2);
  v_average_rating DECIMAL(3, 1);
  v_total_reviews INTEGER;
BEGIN
  -- Calculate active jobs
  SELECT COUNT(*) INTO v_active_jobs
  FROM freelance_jobs
  WHERE freelancer_id = p_freelancer_id AND status = 'in_progress';
  
  -- Calculate completed jobs
  SELECT COUNT(*) INTO v_completed_jobs
  FROM freelance_jobs
  WHERE freelancer_id = p_freelancer_id AND status = 'completed';
  
  -- Calculate total earnings
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
  FROM quickhire_transactions
  WHERE freelancer_id = p_freelancer_id AND status = 'completed';
  
  -- Calculate average rating
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3,1), 0),
    COUNT(*)
  INTO v_average_rating, v_total_reviews
  FROM ratings
  WHERE recipient_id = p_freelancer_id AND service_type = 'quickhire';
  
  -- Insert or update freelancer metrics
  INSERT INTO freelancer_metrics (
    freelancer_id,
    active_jobs,
    completed_jobs,
    total_earnings,
    available_balance,
    average_rating,
    total_reviews,
    updated_at
  ) VALUES (
    p_freelancer_id,
    v_active_jobs,
    v_completed_jobs,
    v_total_earnings,
    v_total_earnings, -- Available balance is initially the same as total earnings
    v_average_rating,
    v_total_reviews,
    NOW()
  )
  ON CONFLICT (freelancer_id) DO UPDATE SET
    active_jobs = v_active_jobs,
    completed_jobs = v_completed_jobs,
    total_earnings = v_total_earnings,
    available_balance = v_total_earnings, -- For simplicity, we're setting available_balance to total_earnings
    average_rating = v_average_rating,
    total_reviews = v_total_reviews,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update metrics when related data changes

-- Trigger for freelance_jobs changes
CREATE OR REPLACE FUNCTION update_metrics_on_job_change() RETURNS TRIGGER AS $$
BEGIN
  -- If a job was completed or status changed to in_progress, update metrics
  IF (TG_OP = 'UPDATE' AND 
      (NEW.status = 'completed' OR NEW.status = 'in_progress' OR 
       OLD.status = 'completed' OR OLD.status = 'in_progress')) THEN
    PERFORM update_freelancer_metrics(NEW.freelancer_id);
  -- If a new job was assigned to a freelancer
  ELSIF (TG_OP = 'UPDATE' AND OLD.freelancer_id IS NULL AND NEW.freelancer_id IS NOT NULL) THEN
    PERFORM update_freelancer_metrics(NEW.freelancer_id);
  -- If a job was created with a freelancer already assigned
  ELSIF (TG_OP = 'INSERT' AND NEW.freelancer_id IS NOT NULL) THEN
    PERFORM update_freelancer_metrics(NEW.freelancer_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_after_job_change
AFTER INSERT OR UPDATE ON freelance_jobs
FOR EACH ROW
EXECUTE FUNCTION update_metrics_on_job_change();

-- Trigger for quickhire_transactions changes
CREATE OR REPLACE FUNCTION update_metrics_on_transaction_change() RETURNS TRIGGER AS $$
BEGIN
  -- Update metrics for the affected freelancer
  PERFORM update_freelancer_metrics(NEW.freelancer_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_after_transaction_change
AFTER INSERT OR UPDATE ON quickhire_transactions
FOR EACH ROW
EXECUTE FUNCTION update_metrics_on_transaction_change();

-- Trigger for ratings changes
CREATE OR REPLACE FUNCTION update_metrics_on_rating_change() RETURNS TRIGGER AS $$
BEGIN
  -- Only process ratings for quickhire service
  IF NEW.service_type = 'quickhire' THEN
    -- Update metrics for the rated freelancer
    PERFORM update_freelancer_metrics(NEW.recipient_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_after_rating_change
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_metrics_on_rating_change();

-- Function to initialize metrics for all freelancers
CREATE OR REPLACE FUNCTION initialize_all_freelancer_metrics() RETURNS VOID AS $$
DECLARE
  freelancer_record RECORD;
BEGIN
  FOR freelancer_record IN 
    SELECT id FROM auth.users WHERE role = 'freelancer'
  LOOP
    PERFORM update_freelancer_metrics(freelancer_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql; 