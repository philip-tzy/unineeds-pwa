-- Comprehensive fix for user registration database issues

-- 1. Check if users table exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'seller', 'freelancer')),
            avatar_url TEXT,
            seller_type TEXT CHECK (seller_type IN ('unishop', 'unifood')),
            freelancer_skill TEXT CHECK (freelancer_skill IN ('programming', 'design', 'writing', 'other')),
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
        
        -- Add RLS policy
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Users policies
        CREATE POLICY "Users can view their own profile" 
            ON public.users FOR SELECT 
            USING (auth.uid() = id);
            
        CREATE POLICY "Users can update their own profile" 
            ON public.users FOR UPDATE 
            USING (auth.uid() = id);
            
        -- Allow service role operations
        CREATE POLICY "Service role can do all operations" 
            ON public.users 
            USING (auth.role() = 'service_role');
            
        RAISE NOTICE 'Created users table with necessary policies';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END
$$;

-- 2. Drop and recreate the trigger function to make it more robust
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    meta_role TEXT;
    meta_name TEXT;
BEGIN
    -- Extract metadata for easier access
    meta_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
    meta_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    -- First check if the user already exists to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
        BEGIN
            INSERT INTO public.users (id, email, name, role, created_at, updated_at)
            VALUES (
                new.id,
                new.email,
                meta_name,
                meta_role,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'New user created in public.users table with ID: %, Name: %, Role: %', new.id, meta_name, meta_role;
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'Unique violation when inserting user: %', new.id;
            WHEN check_violation THEN
                -- If role is invalid, default to customer
                INSERT INTO public.users (id, email, name, role, created_at, updated_at)
                VALUES (
                    new.id,
                    new.email,
                    meta_name,
                    'customer',
                    NOW(),
                    NOW()
                );
                RAISE NOTICE 'Invalid role value, defaulted to customer for user: %', new.id;
            WHEN others THEN
                RAISE NOTICE 'Error creating user in database: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'User already exists in database with ID: %', new.id;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
-- 4. Add an additional trigger for existing users to ensure they're in the users table
DO $$
DECLARE
    missing_users INTEGER := 0;
BEGIN
    -- Count auth users not in public.users
    SELECT COUNT(*) INTO missing_users
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
    
    RAISE NOTICE 'Found % auth users missing from public.users table', missing_users;
    
    -- Insert missing users
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    SELECT 
        au.id, 
        au.email, 
        COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
        COALESCE(au.raw_user_meta_data->>'role', 'customer'),
        NOW(),
        NOW()
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Synchronized users table with auth.users';
END
$$; 