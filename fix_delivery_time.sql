-- Script sederhana untuk menambahkan kolom delivery_time yang hilang

-- 1. Cek jika kolom delivery_time sudah ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'delivery_time'
  ) THEN
    -- Tambahkan kolom delivery_time
    ALTER TABLE public.services ADD COLUMN delivery_time TEXT;
    
    -- Beri nilai default untuk data yang sudah ada
    UPDATE public.services SET delivery_time = '3 days' WHERE delivery_time IS NULL;
    
    -- Ubah menjadi NOT NULL setelah semua data diisi
    ALTER TABLE public.services ALTER COLUMN delivery_time SET NOT NULL;
    
    RAISE NOTICE 'Kolom delivery_time berhasil ditambahkan ke tabel services';
  ELSE
    RAISE NOTICE 'Kolom delivery_time sudah ada di tabel services';
  END IF;
END
$$;

-- 2. Reload schema cache Supabase
SELECT pg_notify('pgrst', 'reload schema'); 