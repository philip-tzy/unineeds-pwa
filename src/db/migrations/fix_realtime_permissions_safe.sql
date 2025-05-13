-- Fix permissions for Supabase Realtime functionality (SAFE VERSION)
-- This script checks if tables exist before attempting to grant permissions

-- Function to safely grant permissions only if table exists
CREATE OR REPLACE FUNCTION grant_select_if_exists(p_table_name text) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        EXECUTE format('GRANT SELECT ON %I TO anon, authenticated', p_table_name);
        RAISE NOTICE 'Granted SELECT on table %', p_table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping grant', p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely add table to publication if exists
CREATE OR REPLACE FUNCTION add_to_publication_if_exists(p_table_name text) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', p_table_name);
            RAISE NOTICE 'Added table % to publication', p_table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error adding % to publication: %', p_table_name, SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping publication add', p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely set replica identity if table exists
CREATE OR REPLACE FUNCTION set_replica_identity_if_exists(p_table_name text) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', p_table_name);
            RAISE NOTICE 'Set REPLICA IDENTITY FULL on table %', p_table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error setting replica identity on %: %', p_table_name, SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping replica identity', p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 1: Make sure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
        RAISE NOTICE 'Created supabase_realtime publication';
    END IF;
END
$$;

-- Step 2: Grant permissions and add to publication only if tables exist
DO $$
DECLARE
    tables text[] := ARRAY['orders', 'users', 'ride_requests', 'notifications', 'profiles', 
                           'driver_stats', 'driver_earnings', 'driver_activity', 
                           'driver_ratings', 'driver_declined_orders',
                           'services', 'skills', 'freelancer_skills', 'freelance_jobs',
                           'job_applications', 'service_offers', 'quickhire_transactions'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        PERFORM grant_select_if_exists(t);
        PERFORM add_to_publication_if_exists(t);
    END LOOP;
END
$$;

-- Step 3: Set replica identity only if tables exist
DO $$
DECLARE
    important_tables text[] := ARRAY['orders', 'users', 'ride_requests', 'notifications',
                                     'services', 'skills', 'freelancer_skills', 'freelance_jobs',
                                     'job_applications', 'service_offers'];
    t text;
BEGIN
    FOREACH t IN ARRAY important_tables
    LOOP
        PERFORM set_replica_identity_if_exists(t);
    END LOOP;
END
$$;

-- Step 4: Verify which tables actually exist and have permissions
SELECT 
    table_name, 
    string_agg(grantee || ':' || privilege_type, ', ') as permissions
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'public' AND
    table_name IN ('orders', 'users', 'ride_requests', 'notifications', 'profiles', 
                   'driver_stats', 'driver_earnings', 'driver_activity', 
                   'driver_ratings', 'driver_declined_orders',
                   'services', 'skills', 'freelancer_skills', 'freelance_jobs',
                   'job_applications', 'service_offers', 'quickhire_transactions') AND
    grantee IN ('anon', 'authenticated')
GROUP BY
    table_name
ORDER BY
    table_name;

-- Step 5: Notify realtime to reload configuration
SELECT pg_notify('realtime', 'reload'); 