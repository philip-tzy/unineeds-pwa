-- Create service_offers table
CREATE TABLE IF NOT EXISTS service_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE service_offers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own offers (as customer or freelancer)
CREATE POLICY "Users can view their own offers"
  ON service_offers FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = freelancer_id);

-- Allow customers to insert offers 
CREATE POLICY "Customers can create offers"
  ON service_offers FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Allow freelancers to update offers
CREATE POLICY "Freelancers can update offers"
  ON service_offers FOR UPDATE
  USING (auth.uid() = freelancer_id)
  WITH CHECK (
    (
      -- Allow changing from pending to accepted/rejected
      (service_offers.status = 'pending' AND 
       status IN ('accepted', 'rejected'))
      OR
      -- Allow changing from accepted to completed
      (service_offers.status = 'accepted' AND 
       status = 'completed')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_offers_customer_id ON service_offers(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_offers_freelancer_id ON service_offers(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_service_offers_service_id ON service_offers(service_id);
CREATE INDEX IF NOT EXISTS idx_service_offers_status ON service_offers(status);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_offers_updated_at
BEFORE UPDATE ON service_offers
FOR EACH ROW
EXECUTE FUNCTION update_service_offers_updated_at(); 