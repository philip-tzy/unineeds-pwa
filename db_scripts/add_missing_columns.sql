-- Add missing columns to profiles table for freelancer profiles

-- Add bio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added bio column to profiles table';
  ELSE
    RAISE NOTICE 'bio column already exists in profiles table';
  END IF;
END $$;

-- Refresh schema cache to make new columns visible to PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Print summary of profiles table structure
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE 'Current profiles table structure:';
  FOR col_record IN 
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '%: %', col_record.column_name, col_record.data_type;
  END LOOP;
END $$; 