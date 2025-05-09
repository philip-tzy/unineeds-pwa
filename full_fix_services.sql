-- SCRIPT PERBAIKAN TABEL SERVICES DAN INSERT DATA UJI
-- Jalankan langkah demi langkah (eksekusi query per blok) jika mengalami error

-- Langkah 1: Drop tabel yang bermasalah (HATI-HATI: menghapus semua data)
-- Uncomment baris di bawah ini jika ingin menghapus dan membuat ulang tabel
-- DROP TABLE IF EXISTS public.services;

-- Langkah 2: Buat tabel jika belum ada dengan struktur yang benar
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

-- Langkah 3: Aktifkan Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Langkah 4: Perbaiki kebijakan (policies)
-- Hapus kebijakan yang sudah ada
DROP POLICY IF EXISTS select_own_services ON public.services;
DROP POLICY IF EXISTS insert_own_services ON public.services;
DROP POLICY IF EXISTS update_own_services ON public.services;
DROP POLICY IF EXISTS delete_own_services ON public.services;

-- Buat kebijakan baru
CREATE POLICY select_own_services ON public.services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_services ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_services ON public.services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_services ON public.services
  FOR DELETE USING (auth.uid() = user_id);

-- Langkah 5: Buat kebijakan SELECT untuk semua pengguna (opsional, jika perlu)
-- Memungkinkan siapa saja melihat semua service
CREATE POLICY view_all_services ON public.services
  FOR SELECT TO PUBLIC USING (true);

-- Langkah 6: Insert data uji untuk memverifikasi struktur berfungsi
-- ANDA HARUS LOGIN SEBAGAI USER DENGAN ID YANG SESUAI untuk ini berhasil
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
  'Jasa Web Development',
  'Web Development',
  'Jasa pembuatan website profesional dengan React dan Next.js',
  1500000,
  '7 hari',
  '081234567890'
) RETURNING *;

-- Langkah 7: Verifikasi data yang dimasukkan
SELECT * FROM public.services ORDER BY created_at DESC LIMIT 10; 