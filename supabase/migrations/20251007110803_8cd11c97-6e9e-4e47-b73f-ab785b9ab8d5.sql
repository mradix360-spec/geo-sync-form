-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.verify_password(user_password_hash text, plain_password text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT user_password_hash = crypt(plain_password, user_password_hash);
$$;

CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT crypt(plain_password, gen_salt('bf', 10));
$$;