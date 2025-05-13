# Unified Seller Role Implementation

This document describes the changes made to implement a unified seller role that can handle both UniShop and UniFood services in a single role, similar to how drivers handle both UniMove and UniSend.

## Changes Made

### Backend

1. **Database Schema**:
   - Removed the seller_type constraint from profiles table
   - Created a new `seller_services` table to track which services a seller provides
   - Added triggers to automatically create seller_services entries when a user becomes a seller
   - Added a service_type column to orders table
   - Created a function to get both products and food items for a seller

2. **API Services**:
   - Created a new `sellerService.ts` with functions to:
     - Get and update seller services
     - Get all seller items (products and food items)
     - Subscribe to real-time updates for seller orders
     - Get comprehensive seller stats for both services

### Frontend

1. **Unified Dashboard**:
   - Created a new combined `Dashboard.tsx` for sellers
   - Implemented tab-based UI to switch between UniShop and UniFood management
   - Shows orders from both services in one place

2. **Navigation**:
   - Updated the SellerBottomNavigation to include links to both UniShop and UniFood functionality
   - Removed the sellerType prop requirement

3. **Profile Page**:
   - Updated the Profile page to display the seller as handling both UniShop and UniFood
   - Removed the "Change seller type" button since sellers now handle both

4. **Routing**:
   - Updated App.tsx to use the new unified seller dashboard
   - Added redirects from old dashboard routes to the new one

## How to Apply Changes

1. Run the database migration script:
   ```
   npm run update-seller-schema
   ```

2. The new dashboard will be accessible at `/seller/dashboard`

3. Existing sellers will automatically be migrated to have both services enabled

## Technical Details

### Seller Services Schema

```sql
CREATE TABLE IF NOT EXISTS seller_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unishop_enabled BOOLEAN DEFAULT TRUE,
  unifood_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id)
);
```

### Orders Schema Change

```sql
ALTER TABLE orders ADD COLUMN service_type TEXT CHECK (service_type IN ('unishop', 'unifood'));
```

### New Triggers

```sql
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

DROP TRIGGER IF EXISTS create_seller_services_trigger ON profiles;
CREATE TRIGGER create_seller_services_trigger
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_seller_services();
``` 