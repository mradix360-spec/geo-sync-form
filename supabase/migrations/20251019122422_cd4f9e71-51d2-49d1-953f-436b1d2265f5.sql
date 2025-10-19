-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types for inspection module
CREATE TYPE inspection_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE inspection_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE inspection_mode AS ENUM ('form', 'camera', 'vr');
CREATE TYPE import_type AS ENUM ('csv', 'geojson', 'manual');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'maintenance', 'decommissioned');

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status asset_status DEFAULT 'active',
  coordinates GEOMETRY(POINT, 4326),
  geojson JSONB,
  model_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organisation_id, asset_id)
);

-- Create inspection_tasks table
CREATE TABLE public.inspection_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_group_ids JSONB DEFAULT '[]'::jsonb,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status inspection_status DEFAULT 'pending',
  priority inspection_priority DEFAULT 'medium',
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create task_assignments table
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.inspection_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.form_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id),
  CHECK (user_id IS NOT NULL OR group_id IS NOT NULL)
);

-- Create inspection_responses table
CREATE TABLE public.inspection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.inspection_tasks(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  form_response_id UUID REFERENCES public.form_responses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  inspection_mode inspection_mode DEFAULT 'form',
  photos JSONB DEFAULT '[]'::jsonb,
  gps_location GEOMETRY(POINT, 4326),
  gps_accuracy NUMERIC,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create asset_imports table
CREATE TABLE public.asset_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  import_type import_type NOT NULL,
  total_records INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  imported_by UUID REFERENCES public.users(id),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_assets_org ON public.assets(organisation_id);
CREATE INDEX idx_assets_coords ON public.assets USING GIST(coordinates);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_inspection_tasks_org ON public.inspection_tasks(organisation_id);
CREATE INDEX idx_inspection_tasks_status ON public.inspection_tasks(status);
CREATE INDEX idx_inspection_tasks_due ON public.inspection_tasks(due_date);
CREATE INDEX idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user ON public.task_assignments(user_id);
CREATE INDEX idx_inspection_responses_task ON public.inspection_responses(task_id);
CREATE INDEX idx_inspection_responses_user ON public.inspection_responses(user_id);

-- Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
CREATE POLICY "Users can view assets in their organization"
  ON public.assets FOR SELECT
  USING (organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins and analysts can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can update assets"
  ON public.assets FOR UPDATE
  USING (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can delete assets"
  ON public.assets FOR DELETE
  USING (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

-- RLS Policies for inspection_tasks
CREATE POLICY "Users can view tasks in their organization"
  ON public.inspection_tasks FOR SELECT
  USING (organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins and analysts can manage tasks"
  ON public.inspection_tasks FOR ALL
  USING (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

-- RLS Policies for task_assignments
CREATE POLICY "Users can view their assignments"
  ON public.task_assignments FOR SELECT
  USING (
    user_id = auth.uid() 
    OR group_id IN (SELECT group_id FROM public.form_group_members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can manage assignments"
  ON public.task_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

-- RLS Policies for inspection_responses
CREATE POLICY "Users can view responses in their organization"
  ON public.inspection_responses FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.inspection_tasks t
      JOIN public.users u ON u.id = auth.uid()
      WHERE t.id = task_id AND t.organisation_id = u.organisation_id
      AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'org_admin', 'analyst')
      )
    )
  );

CREATE POLICY "Assigned users can create responses"
  ON public.inspection_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.task_assignments
      WHERE task_id = inspection_responses.task_id
      AND (user_id = auth.uid() OR group_id IN (
        SELECT group_id FROM public.form_group_members WHERE user_id = auth.uid()
      ))
    )
  );

-- RLS Policies for asset_imports
CREATE POLICY "Users can view imports in their organization"
  ON public.asset_imports FOR SELECT
  USING (organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins and analysts can create imports"
  ON public.asset_imports FOR INSERT
  WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

-- Create storage buckets for asset models and inspection photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-models', 'asset-models', false),
       ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for asset-models
CREATE POLICY "Users can view models in their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'asset-models'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and analysts can upload models"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'asset-models'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'org_admin', 'analyst')
    )
  );

-- Storage policies for inspection-photos
CREATE POLICY "Users can view photos in their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Assigned users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_tasks_updated_at
  BEFORE UPDATE ON public.inspection_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();