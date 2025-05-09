-- SCRIPT RESET TABEL SERVICES DENGAN SEMUA KOLOM YANG DIBUTUHKAN
-- PERHATIAN: Ini akan menghapus semua data services yang ada!

-- 1. Hapus tabel services jika sudah ada (beserta semua datanya)
DROP TABLE IF EXISTS public.services CASCADE;

-- 2. Buat ulang tabel services dari awal dengan struktur yang benar
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

-- 3. Aktifkan Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 4. Buat policies
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

-- 5. Setup storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_portfolios', 'service_portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup storage policies
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

-- 7. Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema'); 