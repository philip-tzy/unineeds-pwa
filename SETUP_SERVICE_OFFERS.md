# Setting up the Service Offers Feature

This document provides instructions on how to set up the Service Offers feature for the UniNeeds platform.

## Current Issues

You may be seeing the following errors:

1. **Multiple GoTrueClient instances detected**: This is caused by multiple instances of the Supabase client being created.
2. **Could not find a relationship between 'service_offers' and 'customer_id'**: The service_offers table does not exist in your database yet.

## Step 1: Fix Supabase Client Instance

We've updated the Supabase client implementation to use a singleton pattern, which prevents multiple instances from being created. This fix is now in place in your codebase.

## Step 2: Create the Service Offers Table

You need to create the service_offers table in your Supabase database. Here's how:

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the SQL code from `migrations/create_service_offers_table.sql`
5. Run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push migrations/create_service_offers_table.sql
```

## Service Offers Table Structure

The service_offers table tracks offers from customers to freelancers for their services:

| Column          | Type          | Description                                      |
|-----------------|---------------|--------------------------------------------------|
| id              | UUID          | Primary key for the offer                        |
| service_id      | UUID          | References the service being offered for         |
| customer_id     | UUID          | The customer making the offer                    |
| freelancer_id   | UUID          | The freelancer receiving the offer               |
| message         | TEXT          | Customer's message/request                       |
| price           | NUMERIC       | Offered price                                    |
| status          | TEXT          | 'pending', 'accepted', 'rejected', 'completed'   |
| created_at      | TIMESTAMP     | When the offer was created                       |
| updated_at      | TIMESTAMP     | When the offer was last updated                  |

## Security

The service_offers table includes Row Level Security (RLS) policies that:

1. Allow users to view their own offers (as customer or freelancer)
2. Allow customers to create new offers
3. Allow freelancers to update only the status of offers they've received

## Using the Feature

Once you've completed these steps, you can use the Service Offers feature, which allows:

1. Customers to make offers on freelancer services
2. Freelancers to receive, accept/reject, and complete offers
3. Real-time updates and notifications

If you encounter any issues, please check the console logs for specific error messages. 