# Database Migrations

This folder contains migration scripts to set up the necessary database tables and relationships for the UniNeeds application.

## Running the Migrations

### service_offers_migration.sql

This migration script creates the `service_offers` table if it doesn't exist, with proper relationships to the `services` and `profiles` tables.

To run this migration:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `service_offers_migration.sql`
6. Click "Run" to execute the script

## Table Structure

### service_offers

This table stores service offers sent by customers to freelancers:

- `id`: UUID primary key
- `service_id`: Foreign key to the services table
- `customer_id`: Foreign key to the profiles table (the customer who sent the offer)
- `freelancer_id`: Foreign key to the profiles table (the freelancer who received the offer)
- `message`: Customer's message/requirements
- `price`: The price offered by the customer
- `status`: One of 'pending', 'accepted', 'rejected', 'completed'
- `created_at`: Timestamp when the offer was created
- `updated_at`: Timestamp when the offer was last updated

## Row Level Security (RLS)

The migration also sets up appropriate RLS policies:

- Customers can see offers they've created
- Freelancers can see offers addressed to them
- Customers can create new offers (but only setting themselves as the customer)
- Freelancers can update offer status from pending to accepted/rejected, or from accepted to completed

## Realtime Subscriptions

The table is enabled for realtime subscriptions, allowing the application to receive real-time updates when offers are created or their status changes. 