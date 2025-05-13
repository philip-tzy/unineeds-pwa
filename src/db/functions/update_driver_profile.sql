-- Stored procedure for updating driver profiles
-- This helps bypass schema cache issues
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
  -- Update the profile
  UPDATE profiles
  SET 
    full_name = p_full_name,
    avatar_url = p_avatar_url,
    vehicle_info = p_vehicle_info,
    contact_info = p_contact_info,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING to_jsonb(profiles.*) INTO result;
  
  -- Return the updated data
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_driver_profile TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION update_driver_profile IS 'Updates a driver profile and bypasses schema cache issues'; 