-- SQL to remove dummy freelancer data
-- This script removes all pre-populated data in freelancer-related tables
-- while preserving the table structure and security policies

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

-- Ensure RLS policies are still active for services
DO $$
BEGIN
    -- Check if RLS is enabled for services
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'services' AND rowsecurity = true
    ) THEN
        -- Enable RLS if not already enabled
        EXECUTE 'ALTER TABLE services ENABLE ROW LEVEL SECURITY;';
    END IF;
    
    -- Re-create policies to ensure they exist
    -- First drop existing ones to avoid duplicates
    DROP POLICY IF EXISTS select_own_services ON services;
    DROP POLICY IF EXISTS insert_own_services ON services;
    DROP POLICY IF EXISTS update_own_services ON services;
    DROP POLICY IF EXISTS delete_own_services ON services;
    
    -- Create policies
    CREATE POLICY select_own_services ON services
        FOR SELECT USING (auth.uid() = user_id);
        
    CREATE POLICY insert_own_services ON services
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
    CREATE POLICY update_own_services ON services
        FOR UPDATE USING (auth.uid() = user_id);
        
    CREATE POLICY delete_own_services ON services
        FOR DELETE USING (auth.uid() = user_id);
END
$$;

-- Ensure RLS policies are still active for skills
DO $$
BEGIN
    -- Check if RLS is enabled for skills
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'skills') THEN
        -- Enable RLS if not already enabled
        EXECUTE 'ALTER TABLE skills ENABLE ROW LEVEL SECURITY;';
        
        -- Re-create policies to ensure they exist
        DROP POLICY IF EXISTS select_own_skills ON skills;
        DROP POLICY IF EXISTS insert_own_skills ON skills;
        DROP POLICY IF EXISTS update_own_skills ON skills;
        DROP POLICY IF EXISTS delete_own_skills ON skills;
        
        -- Create policies
        CREATE POLICY select_own_skills ON skills
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY insert_own_skills ON skills
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY update_own_skills ON skills
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY delete_own_skills ON skills
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Ensure RLS policies are still active for freelancer_skills
DO $$
BEGIN
    -- Check if RLS is enabled for freelancer_skills
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freelancer_skills') THEN
        -- Enable RLS if not already enabled
        EXECUTE 'ALTER TABLE freelancer_skills ENABLE ROW LEVEL SECURITY;';
        
        -- Re-create policies to ensure they exist
        DROP POLICY IF EXISTS select_own_freelancer_skills ON freelancer_skills;
        DROP POLICY IF EXISTS insert_own_freelancer_skills ON freelancer_skills;
        DROP POLICY IF EXISTS update_own_freelancer_skills ON freelancer_skills;
        DROP POLICY IF EXISTS delete_own_freelancer_skills ON freelancer_skills;
        
        -- Create policies
        CREATE POLICY select_own_freelancer_skills ON freelancer_skills
            FOR SELECT USING (auth.uid() = freelancer_id);
            
        CREATE POLICY insert_own_freelancer_skills ON freelancer_skills
            FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
            
        CREATE POLICY update_own_freelancer_skills ON freelancer_skills
            FOR UPDATE USING (auth.uid() = freelancer_id);
            
        CREATE POLICY delete_own_freelancer_skills ON freelancer_skills
            FOR DELETE USING (auth.uid() = freelancer_id);
    END IF;
END
$$;

-- Add an index on user_id for the services table for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_user_id'
    ) THEN
        CREATE INDEX idx_services_user_id ON services(user_id);
    END IF;
END
$$; 