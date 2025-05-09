CREATE OR REPLACE FUNCTION increment_driver_rides(driver_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE drivers
  SET total_rides = COALESCE(total_rides, 0) + 1
  WHERE id = driver_id;
END;
$$;

alter table orders enable row level security;

create policy "Sellers can view their own orders"
  on orders for select
  using (auth.uid() = seller_id);

create policy "Sellers can update their own orders"
  on orders for update
  using (auth.uid() = seller_id);
