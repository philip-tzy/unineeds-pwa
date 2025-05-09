-- Create a table for users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'seller', 'freelancer')),
  avatar_url TEXT,
  seller_type TEXT CHECK (seller_type IN ('unishop', 'unifood')),
  freelancer_skill TEXT CHECK (freelancer_skill IN ('programming', 'design', 'writing', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for products (UniShop)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type TEXT DEFAULT 'unishop' NOT NULL CHECK (service_type = 'unishop'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for food items (UniFood)
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type TEXT DEFAULT 'unifood' NOT NULL CHECK (service_type = 'unifood'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for orders (UniShop and UniFood)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID,
  food_item_id UUID,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  order_status TEXT NOT NULL CHECK (order_status IN ('pending', 'processing', 'completed', 'cancelled')),
  service_type TEXT NOT NULL CHECK (service_type IN ('unishop', 'unifood')),
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT product_or_food_item CHECK (
    (product_id IS NOT NULL AND food_item_id IS NULL AND service_type = 'unishop') OR
    (food_item_id IS NOT NULL AND product_id IS NULL AND service_type = 'unifood')
  ),
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_food_item FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL
);

-- Create a table for ride requests (UniMove)
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  service_type TEXT DEFAULT 'unimove' NOT NULL CHECK (service_type = 'unimove'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for delivery requests (UniSend)
CREATE TABLE delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  package_details TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  service_type TEXT DEFAULT 'unisend' NOT NULL CHECK (service_type = 'unisend'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for freelance jobs (QuickHire)
CREATE TABLE freelance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  freelancer_id UUID REFERENCES users(id),
  skills_required TEXT[],
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  service_type TEXT DEFAULT 'quickhire' NOT NULL CHECK (service_type = 'quickhire'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a table for ratings and reviews
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('unishop', 'unifood', 'unimove', 'unisend', 'quickhire')),
  order_id UUID,
  ride_id UUID,
  delivery_id UUID,
  job_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT different_users CHECK (reviewer_id != recipient_id),
  CONSTRAINT reference_consistency CHECK (
    (service_type IN ('unishop', 'unifood') AND order_id IS NOT NULL AND ride_id IS NULL AND delivery_id IS NULL AND job_id IS NULL) OR
    (service_type = 'unimove' AND ride_id IS NOT NULL AND order_id IS NULL AND delivery_id IS NULL AND job_id IS NULL) OR
    (service_type = 'unisend' AND delivery_id IS NOT NULL AND order_id IS NULL AND ride_id IS NULL AND job_id IS NULL) OR
    (service_type = 'quickhire' AND job_id IS NOT NULL AND order_id IS NULL AND ride_id IS NULL AND delivery_id IS NULL)
  ),
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_ride FOREIGN KEY (ride_id) REFERENCES ride_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_delivery FOREIGN KEY (delivery_id) REFERENCES delivery_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES freelance_jobs(id) ON DELETE SET NULL
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Sellers can insert their own products" 
  ON products FOR INSERT 
  WITH CHECK (auth.uid() = seller_id AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'seller'));

CREATE POLICY "Sellers can update their own products" 
  ON products FOR UPDATE 
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products" 
  ON products FOR DELETE 
  USING (auth.uid() = seller_id);

-- Food items policies
CREATE POLICY "Anyone can view food items" 
  ON food_items FOR SELECT 
  USING (true);

CREATE POLICY "Sellers can insert their own food items" 
  ON food_items FOR INSERT 
  WITH CHECK (auth.uid() = seller_id AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'seller'));

CREATE POLICY "Sellers can update their own food items" 
  ON food_items FOR UPDATE 
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own food items" 
  ON food_items FOR DELETE 
  USING (auth.uid() = seller_id);

-- Orders policies
CREATE POLICY "Customers can view their own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "Sellers can view orders for their products" 
  ON orders FOR SELECT 
  USING (auth.uid() = seller_id);

CREATE POLICY "Customers can create orders" 
  ON orders FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

-- Ride requests policies
CREATE POLICY "Customers can view their own ride requests" 
  ON ride_requests FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view available ride requests" 
  ON ride_requests FOR SELECT 
  USING (driver_id IS NULL OR auth.uid() = driver_id);

CREATE POLICY "Customers can create ride requests" 
  ON ride_requests FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can update ride requests they're assigned to" 
  ON ride_requests FOR UPDATE 
  USING (auth.uid() = driver_id);

-- Delivery requests policies
CREATE POLICY "Customers can view their own delivery requests" 
  ON delivery_requests FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view available delivery requests" 
  ON delivery_requests FOR SELECT 
  USING (driver_id IS NULL OR auth.uid() = driver_id);

CREATE POLICY "Customers can create delivery requests" 
  ON delivery_requests FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can update delivery requests they're assigned to" 
  ON delivery_requests FOR UPDATE 
  USING (auth.uid() = driver_id);

-- Freelance jobs policies
CREATE POLICY "Anyone can view open freelance jobs" 
  ON freelance_jobs FOR SELECT 
  USING (status = 'open' OR auth.uid() = customer_id OR auth.uid() = freelancer_id);

CREATE POLICY "Customers can create freelance jobs" 
  ON freelance_jobs FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Freelancers can update jobs they're assigned to" 
  ON freelance_jobs FOR UPDATE 
  USING (auth.uid() = freelancer_id OR auth.uid() = customer_id);

-- Ratings policies
CREATE POLICY "Anyone can view ratings" 
  ON ratings FOR SELECT 
  USING (true);

CREATE POLICY "Users can create ratings for services they used" 
  ON ratings FOR INSERT 
  WITH CHECK (auth.uid() = reviewer_id);

-- Create function to handle automatic user creation after auth.sign_up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 