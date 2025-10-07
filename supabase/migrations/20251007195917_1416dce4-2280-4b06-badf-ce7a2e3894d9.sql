-- WARNING: Disabling RLS removes all access control
-- Data will be accessible without authentication checks

-- Disable RLS on all tables
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_activity_log DISABLE ROW LEVEL SECURITY;