-- Create a function to safely get pending delivery orders for drivers
-- This function avoids RLS issues by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_pending_delivery_orders_for_driver(driver_uuid UUID)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER -- Run as DB owner to bypass RLS
AS $$
BEGIN
  -- Return pending delivery orders that are not assigned to any driver yet
  RETURN QUERY
  SELECT * FROM orders
  WHERE service_type = 'unisend'
    AND status = 'pending'
    AND driver_id IS NULL
    AND id NOT IN (
      -- Exclude orders this driver has already declined
      SELECT order_id FROM driver_declined_orders
      WHERE driver_id = driver_uuid AND order_type = 'unisend'
    );
END;
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION get_pending_delivery_orders_for_driver(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_delivery_orders_for_driver(UUID) TO anon;

-- Create a function to get a user's role without direct table access
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Run as DB owner to bypass RLS
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to get role from users table
  SELECT role INTO user_role FROM users WHERE id = user_uuid;
  
  -- If not found in users table, check auth.users metadata
  IF user_role IS NULL THEN
    SELECT raw_user_meta_data->>'role' INTO user_role 
    FROM auth.users 
    WHERE id = user_uuid;
  END IF;
  
  RETURN user_role;
END;
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- Reload schema cache to make new functions available
NOTIFY pgrst, 'reload schema'; 