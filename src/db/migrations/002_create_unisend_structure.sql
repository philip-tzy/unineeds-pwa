-- Add UniSend service type to the orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check 
  CHECK (service_type IN ('unishop', 'unifood', 'unimove', 'unisend'));

-- Add columns needed for UniSend deliveries if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_size TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMPTZ;

-- Create driver_declined_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_declined_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL, -- 'unimove' or 'unisend'
  declined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, order_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_declined_orders_driver_id ON driver_declined_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_declined_orders_order_id ON driver_declined_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Enable Row Level Security for driver_declined_orders table
ALTER TABLE driver_declined_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for driver_declined_orders
CREATE POLICY "Drivers can view their own declined orders"
  ON driver_declined_orders FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their own declined orders"
  ON driver_declined_orders FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Add policies for UniSend to the orders table
CREATE POLICY "Customers can view their own UniSend orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = customer_id AND service_type = 'unisend');

CREATE POLICY "Customers can create UniSend orders" 
  ON orders FOR INSERT 
  WITH CHECK (auth.uid() = customer_id AND service_type = 'unisend');

CREATE POLICY "Drivers can view UniSend orders assigned to them" 
  ON orders FOR SELECT 
  USING (auth.uid() = driver_id AND service_type = 'unisend');

CREATE POLICY "Drivers can update UniSend orders assigned to them" 
  ON orders FOR UPDATE 
  USING (auth.uid() = driver_id AND service_type = 'unisend');

-- Allow drivers to see pending orders
CREATE POLICY "Drivers can view pending UniSend orders"
  ON orders FOR SELECT
  USING (
    service_type = 'unisend' AND 
    status = 'pending' AND 
    driver_id IS NULL AND
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'driver')
  );

-- Function to check for nearby UniSend orders
CREATE OR REPLACE FUNCTION get_nearby_unisend_orders(
  driver_lat FLOAT,
  driver_long FLOAT,
  max_distance_km FLOAT DEFAULT 10.0
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  pickup_address TEXT,
  delivery_address TEXT,
  status TEXT,
  service_type TEXT,
  total_amount DECIMAL,
  package_size TEXT,
  created_at TIMESTAMPTZ,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.pickup_address,
    o.delivery_address,
    o.status,
    o.service_type,
    o.total_amount,
    o.package_size,
    o.created_at,
    -- Calculate distance in km using the Haversine formula
    6371 * acos(
      cos(radians(driver_lat)) * cos(radians(ST_Y(o.pickup_coordinates::geometry))) *
      cos(radians(ST_X(o.pickup_coordinates::geometry)) - radians(driver_long)) +
      sin(radians(driver_lat)) * sin(radians(ST_Y(o.pickup_coordinates::geometry)))
    ) AS distance_km
  FROM 
    orders o
  WHERE 
    o.service_type = 'unisend' AND
    o.status = 'pending' AND
    o.driver_id IS NULL AND
    o.pickup_coordinates IS NOT NULL
  HAVING
    6371 * acos(
      cos(radians(driver_lat)) * cos(radians(ST_Y(o.pickup_coordinates::geometry))) *
      cos(radians(ST_X(o.pickup_coordinates::geometry)) - radians(driver_long)) +
      sin(radians(driver_lat)) * sin(radians(ST_Y(o.pickup_coordinates::geometry)))
    ) <= max_distance_km
  ORDER BY
    distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_unisend_orders TO authenticated; 