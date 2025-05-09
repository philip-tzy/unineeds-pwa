-- Add updated_at column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Set default value for updated_at to created_at for existing orders
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;

-- Set default value for future orders
ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;

-- Create the trigger
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_modified_column();

-- Modify the customer_history table to update the action check constraint
ALTER TABLE customer_history DROP CONSTRAINT IF EXISTS customer_history_action_check;
ALTER TABLE customer_history ADD CONSTRAINT customer_history_action_check 
  CHECK (action IN ('order_completed', 'order_cancelled', 'order_processing', 'order_pending')); 