-- Script sederhana untuk memperbaiki tabel services

-- Bagian 1: Jika tabel tidak ada, buat tabel
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  delivery_time TEXT NOT NULL,
  location TEXT,
  whatsapp TEXT NOT NULL DEFAULT '', -- menggunakan whatsapp, bukan contact_whatsapp
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Bagian 2: Jika tabel sudah ada, periksa dan perbaiki kolom whatsapp
DO $$
BEGIN
  -- Periksa apakah kolom contact_whatsapp ada
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'contact_whatsapp'
  ) THEN
    -- Ganti nama kolom contact_whatsapp menjadi whatsapp
    ALTER TABLE public.services RENAME COLUMN contact_whatsapp TO whatsapp;
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'whatsapp'
  ) THEN
    -- Tambah kolom whatsapp jika belum ada
    ALTER TABLE public.services ADD COLUMN whatsapp TEXT NOT NULL DEFAULT '';
  END IF;
END
$$;

-- Bagian 3: Aktifkan Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Bagian 4: Buat policy dasar (hapus dulu jika sudah ada)
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