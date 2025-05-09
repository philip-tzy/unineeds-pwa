-- SCRIPT FINAL UNTUK MEMPERBAIKI TABEL SERVICES

-- BAGIAN 1: BUAT ULANG TABEL SERVICES
-- PERHATIAN: Ini akan menghapus tabel dan membuatnya kembali (hapus semua data)
-- Uncomment HANYA jika ingin membuat ulang tabel dari awal
-- DROP TABLE IF EXISTS public.services CASCADE;

-- BAGIAN 2: BUAT/PERBARUI TABEL SERVICES
CREATE TABLE IF NOT EXISTS public.services (
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

-- BAGIAN 3: AKTIFKAN RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- BAGIAN 4: SET UP POLICIES
-- Hapus policies yang ada
DROP POLICY IF EXISTS select_own_services ON public.services;
DROP POLICY IF EXISTS insert_own_services ON public.services;
DROP POLICY IF EXISTS update_own_services ON public.services; 
DROP POLICY IF EXISTS delete_own_services ON public.services;
DROP POLICY IF EXISTS view_all_services ON public.services;

-- Buat policies yang sesuai
CREATE POLICY select_own_services ON public.services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_services ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_services ON public.services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_services ON public.services
  FOR DELETE USING (auth.uid() = user_id);

-- Buat policy untuk melihat semua services (publik)
CREATE POLICY view_all_services ON public.services
  FOR SELECT TO PUBLIC USING (true);

-- BAGIAN 5: STORAGE
-- Buat bucket jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_portfolios', 'service_portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS service_portfolio_insert_policy ON storage.objects;
CREATE POLICY service_portfolio_insert_policy ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS service_portfolio_update_policy ON storage.objects;
CREATE POLICY service_portfolio_update_policy ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS service_portfolio_delete_policy ON storage.objects;
CREATE POLICY service_portfolio_delete_policy ON storage.objects 
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS service_portfolio_select_policy ON storage.objects;
CREATE POLICY service_portfolio_select_policy ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'service_portfolios');

-- BAGIAN 6: HAPUS CACHE SCHEMA
-- Force refresh the schema cache
NOTIFY pgrst, 'reload schema'; 