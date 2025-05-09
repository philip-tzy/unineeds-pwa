-- Create a services table for freelancers
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

-- Add RLS policies for services table
-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own services
CREATE POLICY select_own_services ON public.services
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own services
CREATE POLICY insert_own_services ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own services
CREATE POLICY update_own_services ON public.services
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own services
CREATE POLICY delete_own_services ON public.services
  FOR DELETE USING (auth.uid() = user_id);

-- Add a storage bucket for service portfolios if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_portfolios', 'service_portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow users to upload files to their own folder in the service_portfolios bucket
CREATE POLICY service_portfolio_insert_policy ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- Only allow uploads to a folder matching the user's ID
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()
  );

-- Policy to allow users to update their own files in the service_portfolios bucket
CREATE POLICY service_portfolio_update_policy ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()
  );

-- Policy to allow users to delete their own files in the service_portfolios bucket
CREATE POLICY service_portfolio_delete_policy ON storage.objects 
  FOR DELETE TO authenticated 
  USING (
    bucket_id = 'service_portfolios' AND 
    (storage.foldername(name))[1] = 'public' AND
    (storage.foldername(name))[2] = auth.uid()
  );

-- Policy to allow anyone to select files from the service_portfolios bucket
CREATE POLICY service_portfolio_select_policy ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'service_portfolios'); 