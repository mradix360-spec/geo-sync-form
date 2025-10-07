-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Organisations table
CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  max_users int DEFAULT 5,
  current_users int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table (custom auth)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'field_staff' CHECK (role IN ('super_admin', 'org_admin', 'field_staff', 'analyst')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forms table
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  schema jsonb NOT NULL,
  geometry_type text CHECK (geometry_type IN ('Point', 'LineString', 'Polygon', 'None')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Form assignments (which users can access which forms)
CREATE TABLE form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(form_id, user_id)
);

-- Form responses (stored as GeoJSON Feature + PostGIS geometry)
CREATE TABLE form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  geojson jsonb NOT NULL,
  geom geometry(Geometry, 4326),
  synced boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spatial index on geometry column
CREATE INDEX idx_form_responses_geom ON form_responses USING GIST(geom);

-- Shares table for public/org/private sharing
CREATE TABLE shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text CHECK (object_type IN ('form', 'dashboard', 'map')),
  object_id uuid NOT NULL,
  access_type text DEFAULT 'private' CHECK (access_type IN ('public', 'org', 'private')),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  shared_with_user uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organisations
CREATE POLICY "Users can view their own organisation"
  ON organisations FOR SELECT
  USING (id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- RLS Policies for users
CREATE POLICY "Users can view users in their organisation"
  ON users FOR SELECT
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- RLS Policies for forms
CREATE POLICY "Users can view forms in their organisation"
  ON forms FOR SELECT
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create forms in their organisation"
  ON forms FOR INSERT
  WITH CHECK (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- RLS Policies for form responses
CREATE POLICY "Users can view responses for forms in their organisation"
  ON form_responses FOR SELECT
  USING (form_id IN (
    SELECT id FROM forms 
    WHERE organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can insert responses for assigned forms"
  ON form_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    form_id IN (SELECT form_id FROM form_assignments WHERE user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_responses_updated_at
  BEFORE UPDATE ON form_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync geometry from geojson
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
$$ LANGUAGE plpgsql;

-- Trigger to automatically sync geometry
CREATE TRIGGER sync_form_responses_geom
  BEFORE INSERT OR UPDATE ON form_responses
  FOR EACH ROW EXECUTE FUNCTION sync_geom_from_geojson();