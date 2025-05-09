-- Check if service_offers table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_offers') THEN
        -- Create service_offers table
        CREATE TABLE public.service_offers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            message TEXT,
            price NUMERIC(10, 2) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_service_offers_service_id ON public.service_offers(service_id);
        CREATE INDEX idx_service_offers_customer_id ON public.service_offers(customer_id);
        CREATE INDEX idx_service_offers_freelancer_id ON public.service_offers(freelancer_id);
        CREATE INDEX idx_service_offers_status ON public.service_offers(status);

        -- Add RLS policies
        ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;

        -- Policy for customers: can see offers they created
        CREATE POLICY customer_read_policy ON public.service_offers 
            FOR SELECT 
            USING (auth.uid() = customer_id);

        -- Policy for freelancers: can see offers addressed to them
        CREATE POLICY freelancer_read_policy ON public.service_offers 
            FOR SELECT 
            USING (auth.uid() = freelancer_id);

        -- Policy for customers: can create new offers (but only set themselves as customer)
        CREATE POLICY customer_insert_policy ON public.service_offers 
            FOR INSERT 
            WITH CHECK (auth.uid() = customer_id);

        -- Policy for freelancers: can update offer status
        CREATE POLICY freelancer_update_policy ON public.service_offers 
            FOR UPDATE 
            USING (auth.uid() = freelancer_id)
            WITH CHECK (
                auth.uid() = freelancer_id 
                AND (
                    (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected')) 
                    OR 
                    (OLD.status = 'accepted' AND NEW.status = 'completed')
                )
            );

        -- Enable realtime subscriptions
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_offers;
    END IF;
END $$; 