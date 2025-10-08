-- Add RLS policies for super admins to view all content across organizations

-- Super admins can view all forms
CREATE POLICY "Super admins can view all forms"
ON public.forms FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all maps
CREATE POLICY "Super admins can view all maps"
ON public.maps FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all dashboards
CREATE POLICY "Super admins can view all dashboards"
ON public.dashboards FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Create function to calculate organization monthly billing
CREATE OR REPLACE FUNCTION public.calculate_organization_monthly_bill(org_id UUID)
RETURNS TABLE (
  role app_role,
  user_count BIGINT,
  price_per_user NUMERIC,
  subtotal NUMERIC,
  total NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH role_counts AS (
    SELECT 
      ur.role,
      COUNT(DISTINCT u.id) as user_count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.organisation_id = org_id 
      AND u.is_active = true
    GROUP BY ur.role
  ),
  role_costs AS (
    SELECT 
      rc.role,
      rc.user_count,
      rp.price_per_month,
      (rc.user_count * rp.price_per_month) as subtotal
    FROM role_counts rc
    JOIN role_pricing rp ON rc.role = rp.role
  )
  SELECT 
    role_costs.role,
    role_costs.user_count,
    role_costs.price_per_user,
    role_costs.subtotal,
    (SELECT SUM(subtotal) FROM role_costs) as total
  FROM role_costs;
END;
$$;