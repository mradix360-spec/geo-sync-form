-- Add RLS policies for organisation_requests table
-- Super admins need to view and update organization requests

-- Policy for super admins to view all organization requests
CREATE POLICY "Super admins can view all org requests"
ON public.organisation_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Policy for super admins to update organization requests
CREATE POLICY "Super admins can update org requests"
ON public.organisation_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Policy for users to view their own requests
CREATE POLICY "Users can view their own requests"
ON public.organisation_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for users to insert their own requests
CREATE POLICY "Users can create org requests"
ON public.organisation_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());