-- Insert a demo organisation if none exists
INSERT INTO public.organisations (name, subscription_tier, max_users, current_users)
VALUES ('Demo Organisation', 'free', 10, 0)
ON CONFLICT DO NOTHING;

-- Insert demo users with correct roles
-- Password for all demo users: "demo123" (you'll need to implement proper password hashing)
INSERT INTO public.users (id, email, password_hash, full_name, role, organisation_id, is_active)
VALUES 
  (
    gen_random_uuid(),
    'admin@demo.com',
    '$2a$10$YourActualHashHere',
    'Admin User',
    'org_admin',
    (SELECT id FROM public.organisations WHERE name = 'Demo Organisation' LIMIT 1),
    true
  ),
  (
    gen_random_uuid(),
    'field@demo.com',
    '$2a$10$YourActualHashHere',
    'Field Staff User',
    'field_staff',
    (SELECT id FROM public.organisations WHERE name = 'Demo Organisation' LIMIT 1),
    true
  ),
  (
    gen_random_uuid(),
    'analyst@demo.com',
    '$2a$10$YourActualHashHere',
    'Analyst User',
    'analyst',
    (SELECT id FROM public.organisations WHERE name = 'Demo Organisation' LIMIT 1),
    true
  )
ON CONFLICT (email) DO NOTHING;