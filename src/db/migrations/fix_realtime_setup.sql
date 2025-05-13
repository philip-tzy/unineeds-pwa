-- Fix Supabase Realtime configuration for UniNeeds

-- Make sure the supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add tables to the realtime publication
-- Note: This is idempotent and won't error if tables are already added
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_declined_orders;

-- Enable replication identity for tables to allow change tracking
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE ride_requests REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Restart the realtime service (this will refresh the configuration)
SELECT pg_notify('realtime', 'restart'); 