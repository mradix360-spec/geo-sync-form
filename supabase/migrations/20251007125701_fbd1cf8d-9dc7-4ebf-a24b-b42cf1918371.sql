-- Temporarily disable RLS on forms table to work with custom auth
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;

-- Disable RLS on related tables
ALTER TABLE public.form_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_activity_log DISABLE ROW LEVEL SECURITY;

-- Note: This is TEMPORARY for development. 
-- You should re-enable RLS with proper policies once custom auth is fully integrated