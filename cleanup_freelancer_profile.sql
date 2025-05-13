-- SQL script to remove dummy freelancer data and enable profile management
-- This script removes dummy data and sets up proper permissions for freelancers

-- 1. Remove dummy data from freelancer-related tables

-- Clear profile dummy data for users with role='freelancer'
UPDATE profiles
SET 
  avatar_url = NULL,
  contact_info = NULL,
  bio = NULL,
  skills = NULL,
  experience = NULL,
  education = NULL,
  portfolio_url = NULL,
  hourly_rate = NULL
WHERE role = 'freelancer';

-- Remove all services data
DELETE FROM services;

-- Remove all skills data 
DELETE FROM skills;

-- Remove all freelancer skills data
DELETE FROM freelancer_skills;

-- Remove all job applications
DELETE FROM job_applications;

-- Remove all freelance jobs
DELETE FROM freelance_jobs;

-- Clean up any associated transactions
DELETE FROM quickhire_transactions;

-- Clean up service_offers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_offers') THEN
        EXECUTE 'DELETE FROM service_offers';
    END IF;
END
$$;

-- 2. Ensure proper RLS policies for profile management

-- Make sure profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select_own_profile ON profiles;
DROP POLICY IF EXISTS users_update_own_profile ON profiles;

-- Create policies that allow users to view and update their own profile
CREATE POLICY users_select_own_profile ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own_profile ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Make sure storage bucket for profile photos exists with proper permissions

-- Create or update storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for uploading profile photos (only to your own folder)
CREATE POLICY upload_own_profile_photo ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'profile_photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for updating own profile photos
CREATE POLICY update_own_profile_photo ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'profile_photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for deleting own profile photos
CREATE POLICY delete_own_profile_photo ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'profile_photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy for reading profile photos (public)
CREATE POLICY read_all_profile_photos ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'profile_photos');

-- 4. Add freelancer profile extension to profiles table if needed

-- Check if freelancer profile fields exist, add them if not
DO $$
BEGIN
    -- Add freelancer-specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills') THEN
        ALTER TABLE profiles ADD COLUMN skills TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience') THEN
        ALTER TABLE profiles ADD COLUMN experience JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'education') THEN
        ALTER TABLE profiles ADD COLUMN education JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'portfolio_url') THEN
        ALTER TABLE profiles ADD COLUMN portfolio_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hourly_rate') THEN
        ALTER TABLE profiles ADD COLUMN hourly_rate NUMERIC(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'contact_info') THEN
        ALTER TABLE profiles ADD COLUMN contact_info JSONB;
    END IF;
END
$$; 