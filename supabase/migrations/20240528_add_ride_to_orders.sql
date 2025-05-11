-- Add columns needed for UniMove to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_coordinates POINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_coordinates POINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Modify service_type check constraint to include unimove
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check 
  CHECK (service_type IN ('unishop', 'unifood', 'unimove'));

-- Modify seller_id constraint to allow NULL for unimove
ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL;

-- Create new RLS policies for UniMove
CREATE POLICY "Customers can view their own ride orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = customer_id AND service_type = 'unimove');

CREATE POLICY "Drivers can view ride orders assigned to them" 
  ON orders FOR SELECT 
  USING (auth.uid() = driver_id AND service_type = 'unimove');

CREATE POLICY "Drivers can update ride orders assigned to them" 
  ON orders FOR UPDATE 
  USING (auth.uid() = driver_id AND service_type = 'unimove');

CREATE POLICY "Customers can create ride orders" 
  ON orders FOR INSERT 
  WITH CHECK (auth.uid() = customer_id AND service_type = 'unimove'); 