-- Fix security linter warnings: Add search_path to trigger functions

-- Update form_responses_generate_geom function
CREATE OR REPLACE FUNCTION form_responses_generate_geom()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.geojson ? 'geometry' THEN
    NEW.geom := ST_SetSRID(
      ST_GeomFromGeoJSON((NEW.geojson->'geometry')::text)::geometry,
      4326
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Update enforce_staff_limit function
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
  SELECT os.staff_limit, o.staff_count
  INTO org_limit, current_count
  FROM organisations o
  LEFT JOIN organisation_subscriptions os ON os.organisation_id = o.id
  WHERE o.id = NEW.organisation_id;
  
  IF org_limit IS NULL THEN
    org_limit := 5;
  END IF;
  
  IF current_count >= org_limit THEN
    RAISE EXCEPTION 'Staff limit (%) reached for organisation', org_limit;
  END IF;
  
  UPDATE organisations 
  SET staff_count = staff_count + 1 
  WHERE id = NEW.organisation_id;
  
  RETURN NEW;
END;
$$;

-- Update decrement_staff_count function
CREATE OR REPLACE FUNCTION decrement_staff_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organisations 
  SET staff_count = GREATEST(0, staff_count - 1)
  WHERE id = OLD.organisation_id;
  RETURN OLD;
END;
$$;