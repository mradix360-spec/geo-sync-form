-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update existing demo user passwords with pgcrypto hashes
UPDATE public.users 
SET password_hash = crypt('demo123', gen_salt('bf', 10))
WHERE email IN ('admin@demo.com', 'field@demo.com', 'analyst@demo.com');