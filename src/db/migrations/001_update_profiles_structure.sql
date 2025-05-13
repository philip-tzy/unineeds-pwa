-- Ensure profiles table has the correct structure
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS vehicle_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create utility function to reload schema cache
CREATE OR REPLACE FUNCTION reload_schema_cache() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the reload function
GRANT EXECUTE ON FUNCTION reload_schema_cache TO authenticated;
GRANT EXECUTE ON FUNCTION reload_schema_cache TO anon;

-- Ensure RLS policies are properly set for profiles table
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create policies that allow users to view and edit their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Create function to create/update profile in one operation
CREATE OR REPLACE FUNCTION upsert_profile(
  profile_id UUID,
  user_full_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL,
  user_contact_info JSONB DEFAULT NULL,
  user_vehicle_info JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert if not exists, update if exists
  INSERT INTO profiles (id, full_name, avatar_url, contact_info, vehicle_info, updated_at)
  VALUES (
    profile_id,
    user_full_name,
    user_avatar_url,
    COALESCE(user_contact_info, '{}'::jsonb),
    COALESCE(user_vehicle_info, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = COALESCE(user_full_name, profiles.full_name),
    avatar_url = COALESCE(user_avatar_url, profiles.avatar_url),
    contact_info = COALESCE(user_contact_info, profiles.contact_info),
    vehicle_info = COALESCE(user_vehicle_info, profiles.vehicle_info),
    updated_at = NOW()
  RETURNING to_jsonb(profiles.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the upsert function
GRANT EXECUTE ON FUNCTION upsert_profile TO authenticated; 