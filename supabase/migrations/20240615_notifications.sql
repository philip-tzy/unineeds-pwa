-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, 
  p_title TEXT, 
  p_message TEXT, 
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications(user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to generate notifications for job applications
CREATE OR REPLACE FUNCTION notify_job_application() RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  customer_id UUID;
  freelancer_name TEXT;
BEGIN
  -- Get job details
  SELECT title, customer_id INTO job_title, customer_id
  FROM freelance_jobs
  WHERE id = NEW.job_id;
  
  -- Get freelancer name
  SELECT name INTO freelancer_name
  FROM users
  WHERE id = NEW.freelancer_id;
  
  -- Create notification for customer
  PERFORM create_notification(
    customer_id,
    'New Job Application',
    freelancer_name || ' has applied for your job: ' || job_title,
    'info',
    '/customer/jobs'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new job applications
DROP TRIGGER IF EXISTS job_application_notification ON job_applications;
CREATE TRIGGER job_application_notification
AFTER INSERT ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_job_application();

-- Create trigger to generate notifications for job application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change() RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  freelancer_id UUID;
BEGIN
  -- Only proceed if status has changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get job details
  SELECT title INTO job_title
  FROM freelance_jobs
  WHERE id = NEW.job_id;
  
  -- Create notification for freelancer
  PERFORM create_notification(
    NEW.freelancer_id,
    'Application ' || INITCAP(NEW.status),
    'Your application for "' || job_title || '" has been ' || NEW.status,
    CASE 
      WHEN NEW.status = 'accepted' THEN 'success'
      WHEN NEW.status = 'rejected' THEN 'error'
      ELSE 'info'
    END,
    '/freelancer/jobs'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS application_status_notification ON job_applications;
CREATE TRIGGER application_status_notification
AFTER UPDATE OF status ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_status_change();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read); 