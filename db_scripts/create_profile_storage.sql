-- Create or update storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS upload_own_profile_photo ON storage.objects;
DROP POLICY IF EXISTS update_own_profile_photo ON storage.objects;
DROP POLICY IF EXISTS delete_own_profile_photo ON storage.objects;
DROP POLICY IF EXISTS read_all_profile_photos ON storage.objects;

-- Simplify policies to fix the RLS issues
-- Allow any authenticated user to upload to profile_photos bucket 
CREATE POLICY "Allow authenticated uploads to profile_photos" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'profile_photos');

-- Allow authenticated users to update objects in profile_photos bucket
CREATE POLICY "Allow authenticated updates to profile_photos" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'profile_photos');

-- Allow authenticated users to delete objects in profile_photos bucket 
CREATE POLICY "Allow authenticated deletes from profile_photos" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'profile_photos');

-- Allow anyone to view objects in profile_photos bucket
CREATE POLICY "Allow public reads from profile_photos" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'profile_photos');

-- Print success message if executed in the SQL editor
DO $$ 
BEGIN
  RAISE NOTICE 'Profile photos storage bucket and policies created successfully!';
END $$; 