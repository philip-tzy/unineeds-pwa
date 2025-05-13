# Fixing Supabase Realtime Connection Issues in UniNeeds

This document explains how to resolve the WebSocket connection errors and missing realtime events that are occurring in the UniNeeds app.

## The Problem

The app is experiencing three types of realtime issues:

1. **WebSocket connection failures**:
   ```
   "Realtime connection failed: Error: Channel error: CLOSED"
   ```

2. **Missing realtime events** for critical tables:
   ```
   "⚠️ No realtime events detected for table orders."
   "⚠️ No realtime events detected for table ride_requests."
   "⚠️ No realtime events detected for table notifications."
   ```

3. **Authentication/Permission denied errors**:
   ```
   GET https://otkhxrrbiqdutlgfkfdm.supabase.co/rest/v1/orders?select=*&service_type=eq.unisend&status=eq.pending&driver_id=is.null 401 (Unauthorized)
   
   Error fetching pending delivery orders: {code: '42501', details: null, hint: null, message: 'permission denied for table users'}
   ```

## Solutions Implemented

We've implemented several fixes to address these issues:

1. **Updated Supabase Client Configuration**:
   - Added support for using `127.0.0.1` instead of `localhost` for WebSocket connections
   - Improved error handling and reconnection logic
   - Added diagnostic functions to identify issues

2. **Added Helper Functions**:
   - `diagnoseRealtimeIssues()`: Checks for WebSocket connection problems
   - `fixRealtimeConnection()`: Attempts to fix connection issues automatically
   - `clearBrowserStorageAndReload()`: Clears cached data that might be causing issues

3. **Created Database Migrations**:
   - Added SQL scripts to ensure tables are properly enabled for realtime events
   - Fixed replication identity settings for proper change tracking
   - **Important**: Added explicit `GRANT SELECT` privileges for anon and authenticated roles

## How to Apply the Fixes

### Automatic Fixes

The code changes should already be in place. To activate them:

1. **Clear browser caches and storage**:
   - Open your browser's console and run:
   ```javascript
   clearBrowserStorageAndReload()
   ```

2. **Check if realtime is working**:
   - After reload, run the diagnostic function:
   ```javascript
   diagnoseRealtimeIssues().then(issues => console.log(issues))
   ```

3. **Try switching to IP address**:
   - If you're still having issues with localhost:
   ```javascript
   fixRealtimeConnection().then(needsReload => { if(needsReload) window.location.reload() })
   ```

### Database Changes (CRITICAL)

You'll need to apply SQL migrations to ensure realtime is properly enabled AND permissions are correctly granted:

1. **Connect to your Supabase project** at https://app.supabase.com/project/otkhxrrbiqdutlgfkfdm

2. **Navigate to the SQL Editor** section

3. **First, check which tables exist in your database** by running:
   - `src/db/migrations/check_tables.sql`
   
   This will help you identify which tables actually exist in your database.

4. **Run the SAFE versions of the realtime fix scripts**:
   - `src/db/migrations/fix_realtime_setup.sql` (ensures tables are in the publication)
   - `src/db/migrations/fix_realtime_permissions_safe.sql` (grants permissions only for tables that exist)

   The safe version checks if tables exist before attempting to grant permissions, avoiding errors like:
   ```
   ERROR: 42P01: relation "driver_stats" does not exist
   ```

5. **Verify the changes** by checking if the tables are now enabled for realtime and have proper permissions:
   ```sql
   -- Check publication setup
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime';
   
   -- Check permissions
   SELECT table_schema, table_name, grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name IN ('orders', 'users', 'ride_requests', 'notifications')
     AND grantee IN ('anon', 'authenticated')
   ORDER BY table_name, grantee;
   ```

## Common Issues and Solutions

### 1. WebSocket Connection Failures

If you're still experiencing WebSocket connection issues:

- **Change URLs**:
  - For local development, use `127.0.0.1` instead of `localhost`
  - For production, ensure your WebSocket connections use `wss://` (secure) protocol

- **Check Nginx Configuration** (if applicable):
  ```nginx
  # Add these to your Nginx configuration
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  ```

- **Clear Browser Cache**:
  - Try a different browser or incognito mode
  - Clear all cookies, local storage, and session storage

### 2. Missing Realtime Events

If tables are still not sending realtime events:

- **Verify Publication Setup**:
  ```sql
  -- Check if tables are added to the publication
  SELECT * FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime';
  
  -- If not, add them
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE ride_requests;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  ```

- **Check Replication Identity**:
  ```sql
  -- Set replication identity to track all columns
  ALTER TABLE orders REPLICA IDENTITY FULL;
  ALTER TABLE ride_requests REPLICA IDENTITY FULL;
  ALTER TABLE notifications REPLICA IDENTITY FULL;
  ```

- **Restart the Realtime Service**:
  ```sql
  -- Send a notification to restart the realtime service
  SELECT pg_notify('realtime', 'restart');
  ```

### 3. Authentication and Permission Issues

This is critical - even with RLS policies configured, you need explicit database grants:

- **Grant SELECT permissions** to both anonymous and authenticated roles:
  ```sql
  -- Grant permissions to both roles
  GRANT SELECT ON orders TO anon, authenticated;
  GRANT SELECT ON users TO anon, authenticated;
  GRANT SELECT ON ride_requests TO anon, authenticated;
  GRANT SELECT ON notifications TO anon, authenticated;
  ```

- **Check Supabase Anon Key**:
  - Ensure you're using the correct anon key from `npx supabase status`
  - Update the key in your application if needed

- **Verify Tenant Configuration**:
  - Check Supabase logs for "tenant not found" errors
  - Fix by updating the tenants table if necessary

### 4. Missing Tables

If you encounter errors about missing tables:

- **Check which tables actually exist**:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```

- **Update schema if needed**: 
  - Create any missing tables that your application needs
  - Only grant permissions for tables that actually exist

- **Use the safe script versions**: 
  - The safe versions of our scripts check if tables exist before trying to modify them

## References

This solution is based on known issues and solutions from:

- [Supabase GitHub Issue #679](https://github.com/supabase/supabase-js/issues/679) - WebSocket connection failures
- [Supabase GitHub Issue #1107](https://github.com/supabase/realtime/issues/1107) - 401 Unauthorized errors with realtime
- [Supabase Documentation on Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Documentation on Tables](https://supabase.com/docs/guides/database/tables) - Creating tables and setting permissions
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting) 