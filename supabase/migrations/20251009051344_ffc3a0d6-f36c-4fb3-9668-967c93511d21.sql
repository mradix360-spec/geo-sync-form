-- Enable RLS on organisation_requests table
ALTER TABLE public.organisation_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other critical tables that are missing it
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_activity_log ENABLE ROW LEVEL SECURITY;

-- Add basic policies for these tables
-- Invoices - Super admins only
CREATE POLICY "Super admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Payments - Super admins only
CREATE POLICY "Super admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Role pricing - Everyone can view, super admins can manage
CREATE POLICY "Everyone can view role pricing"
ON public.role_pricing
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage role pricing"
ON public.role_pricing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Organisation subscriptions - Org admins can view their own, super admins can manage all
CREATE POLICY "Admins can view their org subscription"
ON public.organisation_subscriptions
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can manage subscriptions"
ON public.organisation_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Form activity log - Admins can view org activity
CREATE POLICY "Admins can view org activity log"
ON public.form_activity_log
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);