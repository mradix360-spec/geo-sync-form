-- Fix the ambiguous subtotal reference by fully qualifying the column name
CREATE OR REPLACE FUNCTION public.calculate_organization_monthly_bill(org_id uuid)
RETURNS TABLE(role app_role, user_count integer, price_per_user numeric, subtotal numeric, total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH role_counts AS (
    SELECT 
      ur.role,
      COUNT(DISTINCT u.id)::INTEGER as user_count
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
      (rc.user_count * rp.price_per_month) as line_subtotal
    FROM role_counts rc
    JOIN role_pricing rp ON rc.role = rp.role
  ),
  total_cost AS (
    SELECT SUM(line_subtotal) as total_amount
    FROM role_costs
  )
  SELECT 
    role_costs.role,
    role_costs.user_count,
    role_costs.price_per_month as price_per_user,
    role_costs.line_subtotal as subtotal,
    total_cost.total_amount as total
  FROM role_costs
  CROSS JOIN total_cost;
END;
$$;