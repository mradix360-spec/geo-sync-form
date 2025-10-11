-- Fix user limit enforcement to use organisations.max_users instead of organisation_subscriptions.staff_limit
-- This ensures the limit shown in the UI matches the enforced limit

CREATE OR REPLACE FUNCTION enforce_staff_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_limit int;
  current_count int;
BEGIN
  -- Skip if user is not being assigned to an organization
  IF NEW.organisation_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get max_users and current staff_count from organisations table
  SELECT max_users, staff_count
  INTO org_limit, current_count
  FROM organisations
  WHERE id = NEW.organisation_id;
  
  -- Use default limit if not set
  IF org_limit IS NULL THEN
    org_limit := 5;
  END IF;
  
  -- Check if limit would be exceeded
  IF current_count >= org_limit THEN
    RAISE EXCEPTION 'Organization has reached its user limit of % users. Current count: %. Please contact support to increase your limit.', 
      org_limit, current_count
      USING HINT = 'Upgrade your subscription to add more users';
  END IF;
  
  -- Increment staff count
  UPDATE organisations 
  SET staff_count = staff_count + 1 
  WHERE id = NEW.organisation_id;
  
  RETURN NEW;
END;
$$;