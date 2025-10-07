-- Enable pgcrypto extension (it may already be enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create function to verify password using pgcrypto
CREATE OR REPLACE FUNCTION public.verify_password(user_password_hash text, plain_password text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_password_hash = extensions.crypt(plain_password, user_password_hash);
$$;

-- Create function to hash password using pgcrypto  
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT extensions.crypt(plain_password, extensions.gen_salt('bf', 10));
$$;

-- Update demo users with properly hashed passwords
UPDATE public.users 
SET password_hash = extensions.crypt('demo123', extensions.gen_salt('bf', 10))
WHERE email IN ('admin@demo.com', 'field@demo.com', 'analyst@demo.com');