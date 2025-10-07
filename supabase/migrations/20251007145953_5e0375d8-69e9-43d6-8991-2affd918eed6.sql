-- Disable RLS on all application tables
-- Your custom auth handles security at the application layer

ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_group_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "comprehensive_form_access" ON public.forms;
DROP POLICY IF EXISTS "Org admins and analysts can create forms" ON public.forms;
DROP POLICY IF EXISTS "Org admins and analysts can update forms" ON public.forms;

DROP POLICY IF EXISTS "comprehensive_response_access" ON public.form_responses;
DROP POLICY IF EXISTS "Users can submit to assigned and published forms" ON public.form_responses;

DROP POLICY IF EXISTS "Users can view their form assignments" ON public.form_assignments;
DROP POLICY IF EXISTS "Admins can create form assignments" ON public.form_assignments;

DROP POLICY IF EXISTS "Users can view relevant shares" ON public.shares;
DROP POLICY IF EXISTS "Form creators can create shares" ON public.shares;

DROP POLICY IF EXISTS "Users can view dashboards in their organisation or public ones" ON public.dashboards;
DROP POLICY IF EXISTS "Analysts can create dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Analysts can update their org's dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Analysts can delete their org's dashboards" ON public.dashboards;

DROP POLICY IF EXISTS "Users can view maps in their organisation" ON public.maps;
DROP POLICY IF EXISTS "Analysts can create maps" ON public.maps;
DROP POLICY IF EXISTS "Analysts can update their org's maps" ON public.maps;
DROP POLICY IF EXISTS "Analysts can delete their org's maps" ON public.maps;

DROP POLICY IF EXISTS "Users can view their own organisation" ON public.organisations;

DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON public.organisation_subscriptions;
DROP POLICY IF EXISTS "Users can view their org subscription" ON public.organisation_subscriptions;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

DROP POLICY IF EXISTS "Users can view activity in their org" ON public.form_activity_log;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can manage roles in their org" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view users in their organisation" ON public.users;

DROP POLICY IF EXISTS "Users can view groups in their organisation" ON public.form_groups;
DROP POLICY IF EXISTS "Org admins can create groups" ON public.form_groups;
DROP POLICY IF EXISTS "Org admins can update their org's groups" ON public.form_groups;
DROP POLICY IF EXISTS "Org admins can delete their org's groups" ON public.form_groups;

DROP POLICY IF EXISTS "Users can view members of groups in their org" ON public.form_group_members;
DROP POLICY IF EXISTS "Org admins can manage group members" ON public.form_group_members;