-- Phase 1: Fix user organization assignment and create sample data

-- Step 1: Create a default organization if it doesn't exist
INSERT INTO organisations (id, name, subscription_tier, max_users, staff_count)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'free', 10, 0)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update existing user to have an organization
UPDATE users 
SET organisation_id = '00000000-0000-0000-0000-000000000001'
WHERE organisation_id IS NULL;

-- Step 3: Create sample forms for testing
INSERT INTO forms (id, title, description, geometry_type, schema, is_published, status, published_at, organisation_id, created_by)
VALUES 
(
  gen_random_uuid(),
  'Water Quality Assessment',
  'Collect water quality data including pH, temperature, and turbidity measurements',
  'Point',
  '{
    "fields": [
      {"name": "site_name", "label": "Site Name", "type": "text", "required": true},
      {"name": "ph_level", "label": "pH Level", "type": "number", "required": true},
      {"name": "temperature", "label": "Temperature (°C)", "type": "number", "required": true},
      {"name": "turbidity", "label": "Turbidity (NTU)", "type": "number", "required": true},
      {"name": "notes", "label": "Additional Notes", "type": "textarea", "required": false}
    ]
  }'::jsonb,
  true,
  'published',
  now(),
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM users WHERE email = 'raphaelmussa@outlook.com')
),
(
  gen_random_uuid(),
  'Infrastructure Inspection',
  'Document infrastructure conditions and maintenance needs',
  'Point',
  '{
    "fields": [
      {"name": "asset_type", "label": "Asset Type", "type": "text", "required": true},
      {"name": "condition", "label": "Condition", "type": "select", "options": ["Excellent", "Good", "Fair", "Poor"], "required": true},
      {"name": "maintenance_needed", "label": "Maintenance Needed", "type": "select", "options": ["Yes", "No"], "required": true},
      {"name": "description", "label": "Description", "type": "textarea", "required": false}
    ]
  }'::jsonb,
  true,
  'published',
  now(),
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM users WHERE email = 'raphaelmussa@outlook.com')
),
(
  gen_random_uuid(),
  'Environmental Survey',
  'Record environmental observations and species sightings',
  'Polygon',
  '{
    "fields": [
      {"name": "area_name", "label": "Area Name", "type": "text", "required": true},
      {"name": "habitat_type", "label": "Habitat Type", "type": "text", "required": true},
      {"name": "species_observed", "label": "Species Observed", "type": "textarea", "required": false},
      {"name": "vegetation_cover", "label": "Vegetation Cover (%)", "type": "number", "required": false}
    ]
  }'::jsonb,
  true,
  'published',
  now(),
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM users WHERE email = 'raphaelmussa@outlook.com')
);

-- Step 4: Assign all published forms to the field staff user
INSERT INTO form_assignments (form_id, user_id)
SELECT f.id, u.id
FROM forms f
CROSS JOIN users u
WHERE f.is_published = true 
  AND f.status = 'published'
  AND u.email = 'raphaelmussa@outlook.com'
ON CONFLICT DO NOTHING;