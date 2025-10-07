-- Enable RLS on critical tables
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users in their org"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = users.organisation_id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

CREATE POLICY "Admins can insert users in their org"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = organisation_id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

CREATE POLICY "Admins can update users in their org"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = users.organisation_id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

CREATE POLICY "Admins can delete users in their org"
ON public.users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = users.organisation_id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

-- Organisations table policies
CREATE POLICY "Users can view their own organisation"
ON public.organisations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update their organisation"
ON public.organisations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = organisations.id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

-- Forms table policies
CREATE POLICY "Users can view forms in their org"
ON public.forms FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins and analysts can create forms"
ON public.forms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

CREATE POLICY "Admins and analysts can update forms"
ON public.forms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = forms.organisation_id
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

CREATE POLICY "Admins and analysts can delete forms"
ON public.forms FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = forms.organisation_id
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

-- Form responses policies
CREATE POLICY "Users can view responses in their org"
ON public.form_responses FOR SELECT
TO authenticated
USING (
  form_id IN (
    SELECT id FROM public.forms 
    WHERE organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert their own responses"
ON public.form_responses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Maps policies
CREATE POLICY "Users can view maps in their org"
ON public.maps FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins and analysts can create maps"
ON public.maps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

CREATE POLICY "Admins and analysts can update maps"
ON public.maps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = maps.organisation_id
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

-- Dashboards policies
CREATE POLICY "Users can view dashboards in their org"
ON public.dashboards FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins and analysts can create dashboards"
ON public.dashboards FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

CREATE POLICY "Admins and analysts can update dashboards"
ON public.dashboards FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = dashboards.organisation_id
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

-- Sessions policies (users can only see their own sessions)
CREATE POLICY "Users can view their own sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Form assignments policies
CREATE POLICY "Users can view their assignments"
ON public.form_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all assignments in org"
ON public.form_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND ur.role IN ('super_admin', 'org_admin', 'analyst')
  )
);

-- Shares policies
CREATE POLICY "Users can view shares in their org"
ON public.shares FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

-- Form groups policies
CREATE POLICY "Users can view groups in their org"
ON public.form_groups FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

-- Form group members policies
CREATE POLICY "Users can view group members"
ON public.form_group_members FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM public.form_groups
    WHERE organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    )
  )
);