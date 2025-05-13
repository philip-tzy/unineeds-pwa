# Supabase Permissions Fix for UniNeeds

This document explains how to fix the 403 Forbidden errors that are occurring when drivers try to access orders and user information in the UniNeeds app.

## The Problem

Looking at your error logs, we found two main issues:

1. **403 Forbidden error** when fetching pending delivery orders:
   ```
   GET https://otkhxrrbiqdutlgfkfdm.supabase.co/rest/v1/orders?select=*&service_type=eq.unisend&status=eq.pending&driver_id=is.null 403 (Forbidden)
   ```

2. **Permission denied for table 'users'** error:
   ```
   Error fetching pending delivery orders: {code: '42501', details: null, hint: null, message: 'permission denied for table users'}
   ```

These errors occur because the Supabase Row Level Security (RLS) policies are too restrictive, preventing drivers from accessing the orders table and the users table.

## The Solution

We've implemented multiple fixes to resolve these permission issues:

1. **Code-based fixes already applied**:
   - Updated the Supabase client to include proper authorization headers
   - Added error handling in `UniSendOrderRepository.ts` to try alternative query approaches
   - Created a helper in `databaseFixes.ts` to attempt applying RLS policy fixes at runtime
   - Added initialization in `main.tsx` to apply these fixes on app startup

2. **Database changes that need to be applied manually**:
   - New RLS policies to allow drivers to view pending orders and user information
   - New RPC functions to bypass RLS when needed

## How to Apply the Database Fixes

1. **Open the Supabase Dashboard** for your project at https://app.supabase.com/project/otkhxrrbiqdutlgfkfdm

2. **Go to the SQL Editor** section

3. **Create and run a new query** with the contents of these files:
   - `src/db/migrations/003_create_rpc_functions.sql` (for secure RPC functions)
   - `src/db/migrations/fix_orders_permissions.sql` (for RLS policy fixes)

4. **Alternative SQL fix** if the above doesn't work:
   ```sql
   -- Fix RLS policies for orders and users tables
   
   -- Allow drivers to see pending orders
   DROP POLICY IF EXISTS "Drivers can view pending UniSend orders" ON orders;
   
   CREATE POLICY "Drivers can view pending UniSend orders"
     ON orders FOR SELECT
     USING (
       service_type = 'unisend' AND 
       status = 'pending' AND 
       driver_id IS NULL AND
       (
         EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'driver')
         OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver')
         OR
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND vehicle_info IS NOT NULL)
       )
     );
   
   -- Allow anyone to read users table
   DROP POLICY IF EXISTS "Anyone can read users" ON users;
   
   CREATE POLICY "Anyone can read users"
     ON users FOR SELECT
     USING (true);
   
   -- Ensure RLS is enabled
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ```

## Verifying the Fix

After applying these changes:

1. **Refresh your application** and try logging in as a driver
2. **Check browser console for errors** - the 403 errors should be gone
3. **Use the debug function** we added to check permissions:
   ```javascript
   // In browser console:
   checkDatabasePermissions().then(result => console.log(result));
   ```

## Additional Information

If you continue to experience issues:

1. **Check RLS policies** in Supabase → Authentication → Policies
2. **Review user roles** to ensure drivers have the correct role assigned
3. **Use stored procedures** to bypass RLS when needed for complex queries

For more advanced scenarios, you might need to:

1. **Create a service role API key** for backend operations
2. **Implement edge functions** for sensitive operations
3. **Create more targeted RLS policies** for specific use cases 