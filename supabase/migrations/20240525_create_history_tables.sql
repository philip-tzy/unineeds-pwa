-- Create customer history table
CREATE TABLE IF NOT EXISTS customer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('order_completed', 'order_cancelled')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customer_history_customer_id ON customer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_history_order_id ON customer_history(order_id); 
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS policies for customer_history
ALTER TABLE customer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own history"
  ON customer_history
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "System can insert into customer_history"
  ON customer_history
  FOR INSERT
  WITH CHECK (true);  -- Will be restricted by service role

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Will be restricted by service role 