-- Tabel profiles (sudah ada, tambahkan kolom)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB,
ADD COLUMN IF NOT EXISTS vehicle_info JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Tabel driver_stats untuk menyimpan statistik driver
CREATE TABLE IF NOT EXISTS driver_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  today_earnings NUMERIC(10,2) DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  acceptance_rate INTEGER DEFAULT 0,
  total_distance NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk driver_stats
CREATE INDEX IF NOT EXISTS driver_stats_driver_id_idx ON driver_stats(driver_id);

-- Tabel driver_earnings untuk menyimpan informasi pendapatan driver
CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  today_earnings NUMERIC(10,2) DEFAULT 0,
  weekly_earnings NUMERIC(10,2) DEFAULT 0,
  monthly_earnings NUMERIC(10,2) DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk driver_earnings
CREATE INDEX IF NOT EXISTS driver_earnings_driver_id_idx ON driver_earnings(driver_id);

-- Tabel driver_transactions untuk menyimpan transaksi driver
CREATE TABLE IF NOT EXISTS driver_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  order_type TEXT NOT NULL,
  customer_name TEXT,
  order_id TEXT,
  trip_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk driver_transactions
CREATE INDEX IF NOT EXISTS driver_transactions_driver_id_idx ON driver_transactions(driver_id);
CREATE INDEX IF NOT EXISTS driver_transactions_created_at_idx ON driver_transactions(created_at);

-- Tabel driver_activity untuk menyimpan aktivitas terbaru driver
CREATE TABLE IF NOT EXISTS driver_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk driver_activity
CREATE INDEX IF NOT EXISTS driver_activity_driver_id_idx ON driver_activity(driver_id);
CREATE INDEX IF NOT EXISTS driver_activity_created_at_idx ON driver_activity(created_at);

-- Tabel driver_ratings untuk menyimpan rating driver
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk driver_ratings
CREATE INDEX IF NOT EXISTS driver_ratings_driver_id_idx ON driver_ratings(driver_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_ratings;

-- Row Level Security (RLS) policies
-- Profiles: user can read their own profile, admins can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON profiles 
  FOR SELECT USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY profiles_update_policy ON profiles 
  FOR UPDATE USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Driver stats: only the driver and admins can access
ALTER TABLE driver_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_stats_select_policy ON driver_stats 
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_stats_insert_policy ON driver_stats 
  FOR INSERT WITH CHECK (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_stats_update_policy ON driver_stats 
  FOR UPDATE USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Driver earnings: only the driver and admins can access
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_earnings_select_policy ON driver_earnings 
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_earnings_insert_policy ON driver_earnings 
  FOR INSERT WITH CHECK (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_earnings_update_policy ON driver_earnings 
  FOR UPDATE USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Driver transactions: only the driver and admins can access
ALTER TABLE driver_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_transactions_select_policy ON driver_transactions 
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_transactions_insert_policy ON driver_transactions 
  FOR INSERT WITH CHECK (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Driver activity: only the driver and admins can access
ALTER TABLE driver_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_activity_select_policy ON driver_activity 
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_activity_insert_policy ON driver_activity 
  FOR INSERT WITH CHECK (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Driver ratings: driver can read their own ratings, customers can insert ratings
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_ratings_select_policy ON driver_ratings 
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY driver_ratings_insert_policy ON driver_ratings 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')); 