-- Script to ensure proper RLS policies for profiles table

-- First ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS users_select_own_profile ON profiles;
DROP POLICY IF EXISTS users_update_own_profile ON profiles;

-- Create clean policies
CREATE POLICY profiles_select_policy ON profiles 
  FOR SELECT USING (true);  -- Everyone can view profiles

CREATE POLICY profiles_update_policy ON profiles 
  FOR UPDATE USING (auth.uid() = id);  -- Only the owner can update their profile

-- Optimize performance with an index on id
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Ensure profiles table is in realtime publications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END
$$; 