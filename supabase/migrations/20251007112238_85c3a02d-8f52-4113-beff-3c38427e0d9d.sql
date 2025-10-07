-- Phase 1: Schema enhancements for role-based workflow

-- 1.1 Add unique constraint for assignments
ALTER TABLE form_assignments
ADD CONSTRAINT unique_form_user_assignment UNIQUE (form_id, user_id);

-- 1.2 Form lifecycle fields
ALTER TABLE forms
ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN published_at timestamptz;

-- 1.3 Organisation subscription table
CREATE TABLE organisation_subscriptions (
  organisation_id uuid PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,
  staff_limit int DEFAULT 5 CHECK (staff_limit > 0),
  plan text DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),
  active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Track staff count on organisations
ALTER TABLE organisations ADD COLUMN staff_count int DEFAULT 0 CHECK (staff_count >= 0);

-- 1.5 Activity log for auditing
CREATE TABLE form_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_log_org ON form_activity_log(organisation_id, created_at DESC);
CREATE INDEX idx_activity_log_user ON form_activity_log(user_id, created_at DESC);

-- 1.6 Add client_id for idempotency on form_responses
ALTER TABLE form_responses 
ADD COLUMN client_id text UNIQUE;

CREATE INDEX idx_form_responses_client_id ON form_responses(client_id);

-- 1.7 Trigger to generate geom from GeoJSON
CREATE OR REPLACE FUNCTION form_responses_generate_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geojson ? 'geometry' THEN
    NEW.geom := ST_SetSRID(
      ST_GeomFromGeoJSON((NEW.geojson->'geometry')::text)::geometry,
      4326
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_responses_geom_trigger
BEFORE INSERT OR UPDATE ON form_responses
FOR EACH ROW EXECUTE FUNCTION form_responses_generate_geom();

-- 1.8 Trigger to enforce staff limit
CREATE OR REPLACE FUNCTION enforce_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
  org_limit int;
  current_count int;
BEGIN
  -- Get staff limit for the organisation
  SELECT os.staff_limit, o.staff_count
  INTO org_limit, current_count
  FROM organisations o
  LEFT JOIN organisation_subscriptions os ON os.organisation_id = o.id
  WHERE o.id = NEW.organisation_id;
  
  -- Use default limit if no subscription exists
  IF org_limit IS NULL THEN
    org_limit := 5;
  END IF;
  
  -- Check if adding this user would exceed the limit
  IF current_count >= org_limit THEN
    RAISE EXCEPTION 'Staff limit (%) reached for organisation', org_limit;
  END IF;
  
  -- Increment staff count
  UPDATE organisations 
  SET staff_count = staff_count + 1 
  WHERE id = NEW.organisation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_staff_limit_trigger
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION enforce_staff_limit();

-- 1.9 Trigger to decrement staff count on user deletion
CREATE OR REPLACE FUNCTION decrement_staff_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organisations 
  SET staff_count = GREATEST(0, staff_count - 1)
  WHERE id = OLD.organisation_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_staff_count_trigger
AFTER DELETE ON users
FOR EACH ROW EXECUTE FUNCTION decrement_staff_count();

-- 1.10 Enhanced RLS Policies for Forms

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create forms in their organisation" ON forms;
DROP POLICY IF EXISTS "Users can view forms in their organisation" ON forms;

-- Only org_admin, analyst, super_admin can create forms
CREATE POLICY "Org admins and analysts can create forms" 
ON forms FOR INSERT 
TO authenticated 
WITH CHECK (
  organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'org_admin') 
    OR has_role(auth.uid(), 'analyst')
    OR has_role(auth.uid(), 'super_admin')
  )
);

-- Field staff see only assigned published forms; others see all org forms
CREATE POLICY "Users can view appropriate forms" 
ON forms FOR SELECT 
TO authenticated 
USING (
  CASE
    WHEN has_role(auth.uid(), 'super_admin') THEN true
    WHEN has_role(auth.uid(), 'field_staff') THEN
      id IN (
        SELECT fa.form_id 
        FROM form_assignments fa
        JOIN forms f ON f.id = fa.form_id
        WHERE fa.user_id = auth.uid() AND f.status = 'published'
      )
    ELSE organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  END
);

-- Only org_admin, analyst, super_admin can update forms
CREATE POLICY "Org admins and analysts can update forms" 
ON forms FOR UPDATE 
TO authenticated 
USING (
  organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  AND (
    has_role(auth.uid(), 'org_admin')
    OR has_role(auth.uid(), 'analyst')
    OR has_role(auth.uid(), 'super_admin')
  )
);

-- 1.11 Enhanced RLS for form_responses

DROP POLICY IF EXISTS "Users can insert responses for assigned forms" ON form_responses;

CREATE POLICY "Users can submit to assigned and published forms" 
ON form_responses FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid()
  AND (
    has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'org_admin')
    OR has_role(auth.uid(), 'analyst')
    OR (
      has_role(auth.uid(), 'field_staff')
      AND form_id IN (
        SELECT fa.form_id 
        FROM form_assignments fa
        JOIN forms f ON f.id = fa.form_id
        WHERE fa.user_id = auth.uid()
        AND f.status = 'published'
      )
    )
  )
);

-- 1.12 RLS for activity log
ALTER TABLE form_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity in their org"
ON form_activity_log FOR SELECT
TO authenticated
USING (
  organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
);

-- 1.13 RLS for organisation_subscriptions
ALTER TABLE organisation_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org subscription"
ON organisation_subscriptions FOR SELECT
TO authenticated
USING (
  organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Super admins can manage subscriptions"
ON organisation_subscriptions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- 1.14 GeoJSON export RPC function
CREATE OR REPLACE FUNCTION public.get_form_data_geojson(fid uuid, since_timestamp timestamptz DEFAULT NULL)
RETURNS jsonb 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',
          'id', fr.id,
          'geometry', ST_AsGeoJSON(fr.geom)::jsonb,
          'properties', (fr.geojson - 'geometry') || jsonb_build_object(
            'user_id', fr.user_id,
            'created_at', fr.created_at,
            'updated_at', fr.updated_at
          )
        ) ORDER BY fr.created_at
      ) FILTER (WHERE fr.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  FROM form_responses fr
  WHERE fr.form_id = fid
    AND (since_timestamp IS NULL OR fr.updated_at > since_timestamp);
$$;