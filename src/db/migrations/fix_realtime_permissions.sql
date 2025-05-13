-- Fix permissions for Supabase Realtime functionality

-- Step 1: Grant SELECT privileges on tables to both anonymous and authenticated roles
-- This is crucial for realtime subscriptions to work properly
GRANT SELECT ON orders TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT ON ride_requests TO anon, authenticated;
GRANT SELECT ON notifications TO anon, authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON driver_stats TO anon, authenticated;
GRANT SELECT ON driver_earnings TO anon, authenticated;
GRANT SELECT ON driver_activity TO anon, authenticated;
GRANT SELECT ON driver_ratings TO anon, authenticated;
GRANT SELECT ON driver_declined_orders TO anon, authenticated;

-- Step 2: Ensure the publication includes all necessary tables
-- (This might be redundant if you've run fix_realtime_setup.sql, but it's included for completeness)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_declined_orders;

-- Step 3: Enable row-level replication for full access to changed rows
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE ride_requests REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Step 4: Verify permission setup (optional, comment out in production)
-- This will select the current permissions for the tables
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('orders', 'users', 'ride_requests', 'notifications',
                     'profiles', 'driver_stats', 'driver_earnings', 
                     'driver_activity', 'driver_ratings', 'driver_declined_orders')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- Step 5: Notify realtime to reload configuration
SELECT pg_notify('realtime', 'reload'); 