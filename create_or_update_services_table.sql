-- This script will create the services table if it doesn't exist
-- or update the existing one to ensure it has the correct schema

-- Check if the services table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'services'
    ) THEN
        -- Create the services table with the correct schema
        CREATE TABLE public.services (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            price NUMERIC(10, 2) NOT NULL,
            delivery_time TEXT NOT NULL,
            location TEXT,
            whatsapp TEXT NOT NULL,
            portfolio_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );

        -- Enable Row Level Security
        ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

        -- Policy to allow users to select their own services
        CREATE POLICY select_own_services ON public.services
            FOR SELECT USING (auth.uid() = user_id);

        -- Policy to allow users to insert their own services
        CREATE POLICY insert_own_services ON public.services
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Policy to allow users to update their own services
        CREATE POLICY update_own_services ON public.services
            FOR UPDATE USING (auth.uid() = user_id);

        -- Policy to allow users to delete their own services
        CREATE POLICY delete_own_services ON public.services
            FOR DELETE USING (auth.uid() = user_id);

        RAISE NOTICE 'Services table created with correct schema';
    ELSE
        -- Table exists, check if it has the contact_whatsapp column
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'services' 
            AND column_name = 'contact_whatsapp'
        ) THEN
            -- Rename contact_whatsapp column to whatsapp
            ALTER TABLE public.services RENAME COLUMN contact_whatsapp TO whatsapp;
            RAISE NOTICE 'Column renamed from contact_whatsapp to whatsapp';
        ELSE
            -- Check if the whatsapp column already exists
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'services' 
                AND column_name = 'whatsapp'
            ) THEN
                -- Add the whatsapp column
                ALTER TABLE public.services ADD COLUMN whatsapp TEXT NOT NULL DEFAULT '';
                RAISE NOTICE 'Added whatsapp column';
            ELSE
                RAISE NOTICE 'whatsapp column already exists';
            END IF;
        END IF;

        -- Ensure all required columns exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'services' 
            AND column_name = 'portfolio_url'
        ) THEN
            ALTER TABLE public.services ADD COLUMN portfolio_url TEXT;
            RAISE NOTICE 'Added portfolio_url column';
        END IF;

        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'services' 
            AND column_name = 'location'
        ) THEN
            ALTER TABLE public.services ADD COLUMN location TEXT;
            RAISE NOTICE 'Added location column';
        END IF;

        -- Ensure RLS is enabled
        ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

        -- Recreate policies if they don't exist
        DROP POLICY IF EXISTS select_own_services ON public.services;
        CREATE POLICY select_own_services ON public.services
            FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS insert_own_services ON public.services;
        CREATE POLICY insert_own_services ON public.services
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS update_own_services ON public.services;
        CREATE POLICY update_own_services ON public.services
            FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS delete_own_services ON public.services;
        CREATE POLICY delete_own_services ON public.services
            FOR DELETE USING (auth.uid() = user_id);

        RAISE NOTICE 'Services table updated with correct schema';
    END IF;
END
$$;

-- Add a storage bucket for service portfolios if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_portfolios', 'service_portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow users to upload files to their own folder in the service_portfolios bucket
DROP POLICY IF EXISTS service_portfolio_insert_policy ON storage.objects;
CREATE POLICY service_portfolio_insert_policy ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy to allow users to update their own files in the service_portfolios bucket
DROP POLICY IF EXISTS service_portfolio_update_policy ON storage.objects;
CREATE POLICY service_portfolio_update_policy ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy to allow users to delete their own files in the service_portfolios bucket
DROP POLICY IF EXISTS service_portfolio_delete_policy ON storage.objects;
CREATE POLICY service_portfolio_delete_policy ON storage.objects 
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy to allow anyone to select files from the service_portfolios bucket
DROP POLICY IF EXISTS service_portfolio_select_policy ON storage.objects;
CREATE POLICY service_portfolio_select_policy ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'service_portfolios'); 