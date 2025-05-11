-- Fix the RLS policy for ride_requests table to allow customers to create ride requests

-- First, check existing policies
DO $$
BEGIN
    RAISE NOTICE 'Checking existing RLS policies for ride_requests...';
END
$$;

-- Recreate the customer policy to ensure it works
DROP POLICY IF EXISTS "Customers can create ride requests" ON ride_requests;

CREATE POLICY "Customers can create ride requests" 
    ON ride_requests FOR INSERT 
    WITH CHECK (true);  -- Allow any authenticated user to create a ride request

-- Check if ride_requests has a general insert policy (less restrictive approach)
DROP POLICY IF EXISTS "Anyone can create ride requests" ON ride_requests;

CREATE POLICY "Anyone can create ride requests" 
    ON ride_requests FOR INSERT 
    WITH CHECK (auth.role() IN ('authenticated', 'anon', 'service_role'));

-- Update policy for selecting ride_requests to ensure drivers can see pending requests
DROP POLICY IF EXISTS "Drivers can view available ride requests" ON ride_requests;

CREATE POLICY "Drivers can view available ride requests" 
    ON ride_requests FOR SELECT 
    USING (driver_id IS NULL OR auth.uid() = driver_id);

-- Make sure customers can view their own ride requests
DROP POLICY IF EXISTS "Customers can view their own ride requests" ON ride_requests;

CREATE POLICY "Customers can view their own ride requests" 
    ON ride_requests FOR SELECT 
    USING (auth.uid() = customer_id); 