-- SCRIPT RESET TABEL SERVICES - GUNAKAN JIKA DIPERLUKAN
-- PERHATIAN: Ini akan menghapus semua data services yang ada!

-- 1. Hapus semua policies terkait tabel services
DO $$
BEGIN
  -- Hapus services policies
  DROP POLICY IF EXISTS select_own_services ON public.services;
  DROP POLICY IF EXISTS insert_own_services ON public.services;
  DROP POLICY IF EXISTS update_own_services ON public.services;
  DROP POLICY IF EXISTS delete_own_services ON public.services;
  DROP POLICY IF EXISTS view_all_services ON public.services;
  
  -- Hapus storage policies
  DROP POLICY IF EXISTS service_portfolio_insert_policy ON storage.objects;
  DROP POLICY IF EXISTS service_portfolio_update_policy ON storage.objects;
  DROP POLICY IF EXISTS service_portfolio_delete_policy ON storage.objects;
  DROP POLICY IF EXISTS service_portfolio_select_policy ON storage.objects;
END
$$;

-- 2. Hapus tabel services
DROP TABLE IF EXISTS public.services CASCADE;

-- 3. Buat tabel baru dengan struktur yang benar
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

-- 4. Aktifkan RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. Buat policies baru
CREATE POLICY select_own_services ON public.services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_services ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_services ON public.services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_services ON public.services
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY view_all_services ON public.services
  FOR SELECT TO PUBLIC USING (true);

-- 6. Siapkan storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_portfolios', 'service_portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Buat storage policies
CREATE POLICY service_portfolio_insert_policy ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY service_portfolio_update_policy ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY service_portfolio_delete_policy ON storage.objects 
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY service_portfolio_select_policy ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'service_portfolios');

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Insert data test
-- Uncomment dan sesuaikan dengan ID Anda
/*
INSERT INTO public.services (
  user_id,
  title,
  category,
  description,
  price,
  delivery_time,
  whatsapp
) VALUES (
  '4d856e8d-b3f9-449a-8850-cadd1e7b46a6', -- Ganti dengan user_id Anda
  'Test Service After Reset',
  'Web Development',
  'This is a test service after resetting the table',
  100000,
  '3 days',
  '081234567890'
) RETURNING *;
*/ 