-- Update the database schema for the unified seller role

-- 1. Update the profiles table to remove seller_type column constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_seller_type_check;

-- 2. Add services table to track which services a seller provides
CREATE TABLE IF NOT EXISTS seller_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unishop_enabled BOOLEAN DEFAULT TRUE,
  unifood_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- 3. Create function to automatically create seller_services entry when a user becomes a seller
CREATE OR REPLACE FUNCTION create_seller_services()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'seller' THEN
    INSERT INTO seller_services (seller_id)
    VALUES (NEW.id)
    ON CONFLICT (seller_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to run the function when a user profile is updated
DROP TRIGGER IF EXISTS create_seller_services_trigger ON profiles;
CREATE TRIGGER create_seller_services_trigger
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_seller_services();

-- 5. Add a service_type column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN service_type TEXT CHECK (service_type IN ('unishop', 'unifood'));
  END IF;
END $$;

-- 6. Migrate existing sellers to have both services enabled
INSERT INTO seller_services (seller_id)
SELECT id FROM profiles WHERE role = 'seller'
ON CONFLICT (seller_id) DO NOTHING;

-- 7. Add a function to get both products and food items for a seller
CREATE OR REPLACE FUNCTION get_all_seller_items(p_seller_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  is_available BOOLEAN,
  item_type TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.price, 
      p.is_active AS is_available, 
      'product' AS item_type,
      p.created_at
    FROM products p
    WHERE p.seller_id = p_seller_id
    UNION ALL
    SELECT 
      f.id, 
      f.name, 
      f.description, 
      f.price, 
      f.is_available, 
      'food_item' AS item_type,
      f.created_at
    FROM food_items f
    WHERE f.seller_id = p_seller_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql; 