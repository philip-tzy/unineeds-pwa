-- Update database schema to differentiate between UniShop and UniFood items

-- 1. Add service_type column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE products ADD COLUMN service_type TEXT DEFAULT 'unishop';
    
    -- Update all existing products to have 'unishop' service_type
    UPDATE products SET service_type = 'unishop';
    
    -- Add constraint to enforce service_type value
    ALTER TABLE products ADD CONSTRAINT products_service_type_check 
      CHECK (service_type = 'unishop');
  END IF;
END $$;

-- 2. Add service_type column to food_items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'food_items' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE food_items ADD COLUMN service_type TEXT DEFAULT 'unifood';
    
    -- Update all existing food items to have 'unifood' service_type
    UPDATE food_items SET service_type = 'unifood';
    
    -- Add constraint to enforce service_type value
    ALTER TABLE food_items ADD CONSTRAINT food_items_service_type_check 
      CHECK (service_type = 'unifood');
  END IF;
END $$;

-- 3. Create or update functions to get items by service type
CREATE OR REPLACE FUNCTION get_items_by_service_type(p_service_type TEXT)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  service_type TEXT,
  item_type TEXT
) AS $$
BEGIN
  IF p_service_type = 'unishop' THEN
    RETURN QUERY
      SELECT 
        p.id, 
        p.seller_id, 
        p.name, 
        p.description, 
        p.price, 
        p.image_url, 
        p.created_at, 
        p.updated_at, 
        p.service_type,
        'product'::TEXT AS item_type
      FROM products p
      WHERE p.service_type = 'unishop';
  ELSIF p_service_type = 'unifood' THEN
    RETURN QUERY
      SELECT 
        f.id, 
        f.seller_id, 
        f.name, 
        f.description, 
        f.price, 
        f.image_url, 
        f.created_at, 
        f.updated_at, 
        f.service_type,
        'food_item'::TEXT AS item_type
      FROM food_items f
      WHERE f.service_type = 'unifood';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create or update function to get customer visible items by service type
CREATE OR REPLACE FUNCTION get_customer_items_by_service_type(p_service_type TEXT)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  seller_name TEXT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  service_type TEXT
) AS $$
BEGIN
  IF p_service_type = 'unishop' THEN
    RETURN QUERY
      SELECT 
        p.id, 
        p.seller_id,
        prof.full_name AS seller_name,
        p.name, 
        p.description, 
        p.price, 
        p.image_url,
        COALESCE(
          (SELECT AVG(r.rating) FROM ratings r 
           WHERE r.item_id = p.id AND r.service_type = 'unishop'),
          0
        ) AS rating,
        p.service_type
      FROM products p
      JOIN profiles prof ON p.seller_id = prof.id
      WHERE p.service_type = 'unishop' AND p.is_active = true;
  ELSIF p_service_type = 'unifood' THEN
    RETURN QUERY
      SELECT 
        f.id, 
        f.seller_id,
        prof.full_name AS seller_name,
        f.name, 
        f.description, 
        f.price, 
        f.image_url,
        COALESCE(
          (SELECT AVG(r.rating) FROM ratings r 
           WHERE r.item_id = f.id AND r.service_type = 'unifood'),
          0
        ) AS rating,
        f.service_type
      FROM food_items f
      JOIN profiles prof ON f.seller_id = prof.id
      WHERE f.service_type = 'unifood' AND f.is_available = true;
  END IF;
END;
$$ LANGUAGE plpgsql; 