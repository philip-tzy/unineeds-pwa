-- Fix the user creation trigger to be more robust
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- First check if the user already exists to avoid conflicts
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'role', 'customer'),
      NOW(),
      NOW()
    );
    RAISE NOTICE 'New user created in public.users table with ID: %', new.id;
  ELSE
    RAISE NOTICE 'User already exists in public.users table with ID: %', new.id;
  END IF;
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating user in public.users table: %', SQLERRM;
    RETURN new; -- Return new anyway to prevent auth signup from failing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 