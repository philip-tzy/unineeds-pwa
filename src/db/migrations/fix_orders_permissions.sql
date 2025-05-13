-- Fix permission issues for orders table and driver access

-- Create RLS policy to allow drivers to view pending orders without requiring a role in user_metadata
DROP POLICY IF EXISTS "Drivers can view pending UniSend orders" ON orders;

CREATE POLICY "Drivers can view pending UniSend orders"
  ON orders FOR SELECT
  USING (
    service_type = 'unisend' AND 
    status = 'pending' AND 
    driver_id IS NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND 
      (profiles.vehicle_info IS NOT NULL OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'driver'))
    )
  );
  
-- Create policy for accessing user information (missing in original migrations)
DROP POLICY IF EXISTS "Anyone can read users" ON users;

CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);
  
-- Ensure RLS is enabled on both tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Notify Postgres to reload the schema cache
NOTIFY pgrst, 'reload schema'; 