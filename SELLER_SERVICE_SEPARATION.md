# Simplified Seller Role with Service Type Separation

This document explains how we've updated the seller role to handle both UniShop and UniFood features with a cleaner, simplified interface.

## Overview

The seller role now supports both UniShop and UniFood services under a single role. We've maintained a clear separation between service types while simplifying the user interface to match the prototype design.

## Database Changes

1. **Added Service Type Columns**:
   - Added `service_type` column to the `products` table with a constraint ensuring it's always `'unishop'`
   - Added `service_type` column to the `food_items` table with a constraint ensuring it's always `'unifood'`

2. **Created Database Functions**:
   - `get_items_by_service_type`: Returns items filtered by service type
   - `get_customer_items_by_service_type`: Returns customer-visible items by service type

## UI/UX Changes

1. **Simplified Dashboard**:
   - Clean header with seller name and notification icons
   - Two distinct service cards for UniShop and UniFood
   - Each card has direct buttons to view and add items

2. **Streamlined Bottom Navigation**:
   - Simplified to just 3 main items: Home, Orders, and Account
   - Removed the complex dropdown for items

3. **Add Item Pages**:
   - Each service has its own dedicated add item page
   - UniShop products and UniFood items are handled separately

## How It Works

1. When a seller wants to manage products:
   - They can navigate directly from the dashboard using the dedicated service cards
   - UniShop and UniFood are clearly separated visually
   - Each service has its appropriate forms and listings

2. Customer experience:
   - Items added to UniShop are only visible in the UniShop feature
   - Items added to UniFood are only visible in the UniFood feature

## Conclusion

This implementation streamlines the seller experience while maintaining logical separation between services. The simplified UI follows the prototype design closely while preserving all the necessary functionality.

## Migration

Run the following command to apply the database changes:
```
npm run update-item-service-type
``` 