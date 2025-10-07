-- Fix RLS policies for form_assignments
CREATE POLICY "Users can view their form assignments"
  ON form_assignments FOR SELECT
  USING (user_id = auth.uid() OR 
         form_id IN (SELECT id FROM forms WHERE created_by = auth.uid()));

CREATE POLICY "Admins can create form assignments"
  ON form_assignments FOR INSERT
  WITH CHECK (form_id IN (SELECT id FROM forms WHERE created_by = auth.uid()));

-- Fix RLS policies for shares
CREATE POLICY "Users can view shares they created or own"
  ON shares FOR SELECT
  USING (
    object_id IN (SELECT id FROM forms WHERE created_by = auth.uid()) OR
    shared_with_user = auth.uid() OR
    access_type = 'public'
  );

CREATE POLICY "Users can create shares for their forms"
  ON shares FOR INSERT
  WITH CHECK (object_id IN (SELECT id FROM forms WHERE created_by = auth.uid()));

-- Fix function search paths
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION sync_geom_from_geojson()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geojson->'geometry' IS NOT NULL AND NEW.geojson->>'geometry' != 'null' THEN
    NEW.geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.geojson->>'geometry'), 4326);
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;