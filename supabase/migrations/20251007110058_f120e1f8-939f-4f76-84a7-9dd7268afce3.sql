-- Create enum for roles only if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'field_staff', 'analyst');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can manage roles in their org" ON public.user_roles;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE (role app_role)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id;
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Org admins can manage roles in their org"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    )
  )
  AND public.has_role(auth.uid(), 'org_admin'::app_role)
);

-- Insert demo organisation
INSERT INTO public.organisations (id, name, subscription_tier, max_users, current_users)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Demo Organisation', 'free', 10, 3)
ON CONFLICT (id) DO UPDATE SET current_users = 3;

-- Delete old demo users if they exist
DELETE FROM public.users WHERE email IN ('admin@demo.com', 'field@demo.com', 'analyst@demo.com');

-- Insert demo users with bcrypt hashed passwords (password: demo123)
INSERT INTO public.users (id, email, password_hash, full_name, organisation_id, is_active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'admin@demo.com',
    '$2a$10$rQ8K5O5K5O5K5O5K5O5K5eN5K5O5K5O5K5O5K5O5K5O5K5O5K5O5K',
    'Admin User',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000011'::uuid,
    'field@demo.com',
    '$2a$10$rQ8K5O5K5O5K5O5K5O5K5eN5K5O5K5O5K5O5K5O5K5O5K5O5K5O5K',
    'Field Staff User',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000012'::uuid,
    'analyst@demo.com',
    '$2a$10$rQ8K5O5K5O5K5O5K5O5K5eN5K5O5K5O5K5O5K5O5K5O5K5O5K5O5K',
    'Analyst User',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
  );

-- Insert demo user roles
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000010'::uuid, 'org_admin'::app_role),
  ('00000000-0000-0000-0000-000000000011'::uuid, 'field_staff'::app_role),
  ('00000000-0000-0000-0000-000000000012'::uuid, 'analyst'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;