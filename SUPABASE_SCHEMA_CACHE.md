# Fixing Supabase Schema Cache Issues

This document explains how to fix issues with the Supabase schema cache, which can cause errors like:

```
Could not find the 'contact_info' column of 'profiles' in the schema cache
```

## Understanding the Problem

The Supabase API is powered by PostgREST, which maintains a cache of your database schema. Sometimes this cache doesn't update automatically when you make changes to your database structure, leading to errors when accessing new columns or tables.

## Solution 1: Deploy Database Changes

We've created a deployment script that will:
1. Create necessary database functions
2. Run migrations to ensure table structure is correct
3. Reload the schema cache

Run the following command:

```bash
# Set your Supabase service key first
export SUPABASE_SERVICE_KEY=your_service_key_here

# Then run the deployment script
node deploy_database_changes.js
```

You can find your service key in the Supabase dashboard under Project Settings > API > Project API keys > service_role.

## Solution 2: Manual Fixes

If the deployment script doesn't work, you can try these steps:

### 1. Reload the Schema Cache

Connect to your Supabase database using the SQL editor in the Supabase dashboard and run:

```sql
-- Create the reload function if it doesn't exist
CREATE OR REPLACE FUNCTION reload_schema_cache() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to reload the cache
SELECT reload_schema_cache();
```

### 2. Ensure Table Structure

Make sure your profiles table has the correct structure:

```sql
-- Add missing columns to profiles
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS vehicle_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

### 3. Create Helper Functions

Create functions to bypass schema cache issues:

```sql
-- Function to update driver profiles
CREATE OR REPLACE FUNCTION update_driver_profile(
  p_id UUID,
  p_full_name TEXT,
  p_avatar_url TEXT,
  p_vehicle_info JSONB,
  p_contact_info JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE profiles
  SET 
    full_name = p_full_name,
    avatar_url = p_avatar_url,
    vehicle_info = p_vehicle_info,
    contact_info = p_contact_info,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING to_jsonb(profiles.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_driver_profile TO authenticated;
```

## Solution 3: Use the App's Built-in Workarounds

The app now includes multiple fallback strategies:

1. First attempts to use `upsert_profile` function
2. Falls back to `update_driver_profile` function
3. Tries to reload schema cache
4. Uses direct SQL update as a last resort

These changes should allow driver profiles to be updated properly even with schema cache issues.

## Debugging

If you're still encountering issues:

1. Check the browser console for specific error messages
2. Look for errors with code 'PGRST204'
3. Verify your Supabase permissions are correctly set

For further assistance, please contact support with the full error details. 