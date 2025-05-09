-- Check if the services table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'services'
    ) THEN
        -- Check if the contact_whatsapp column exists
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
    ELSE
        RAISE NOTICE 'services table does not exist';
    END IF;
END
$$; 