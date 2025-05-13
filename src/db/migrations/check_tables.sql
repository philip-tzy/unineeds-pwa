-- Check which tables exist in the public schema

-- List all tables in the public schema
SELECT 
    table_name,
    table_type,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM 
    information_schema.tables t
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- Check specifically for the tables we're interested in
SELECT 
    table_name,
    'Exists' as status
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' AND
    table_name IN ('orders', 'users', 'ride_requests', 'notifications', 'profiles', 
                  'driver_stats', 'driver_earnings', 'driver_activity', 
                  'driver_ratings', 'driver_declined_orders')
ORDER BY 
    table_name;

-- List all publications and their tables
SELECT 
    pubname,
    tablename
FROM 
    pg_publication_tables
ORDER BY 
    pubname, tablename; 