-- 1. Memeriksa struktur tabel services
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;

-- 2. Melihat policies yang terpasang pada tabel services
SELECT * FROM pg_policies WHERE tablename = 'services';

-- 3. Mencoba insert data uji ke tabel services
-- PERHATIAN: Ganti UUID user_id dengan UUID yang valid (ID Anda) sebelum menjalankan
INSERT INTO public.services (
  user_id,
  title,
  category,
  description,
  price,
  delivery_time,
  whatsapp
) VALUES (
  '4d856e8d-b3f9-449a-8850-cadd1e7b46a6', -- Sesuaikan dengan ID user Anda
  'Test Service',
  'Web Development',
  'This is a test service description',
  100000,
  '3 days',
  '081234567890'
) RETURNING *; 