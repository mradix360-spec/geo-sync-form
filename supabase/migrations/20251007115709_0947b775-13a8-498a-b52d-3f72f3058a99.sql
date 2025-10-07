-- Create maps table for storing map configurations
CREATE TABLE public.maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  config JSONB NOT NULL DEFAULT '{"layers": [], "viewport": {"center": [0, 0], "zoom": 2}}'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dashboards table for storing dashboard configurations
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  config JSONB NOT NULL DEFAULT '{"layout": [], "widgets": []}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maps
CREATE POLICY "Users can view maps in their organisation"
ON public.maps
FOR SELECT
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Analysts can create maps"
ON public.maps
FOR INSERT
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Analysts can update their org's maps"
ON public.maps
FOR UPDATE
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Analysts can delete their org's maps"
ON public.maps
FOR DELETE
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- RLS Policies for dashboards
CREATE POLICY "Users can view dashboards in their organisation or public ones"
ON public.dashboards
FOR SELECT
USING (
  is_public = true
  OR organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Analysts can create dashboards"
ON public.dashboards
FOR INSERT
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Analysts can update their org's dashboards"
ON public.dashboards
FOR UPDATE
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Analysts can delete their org's dashboards"
ON public.dashboards
FOR DELETE
USING (
  organisation_id IN (
    SELECT organisation_id FROM users WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'analyst'::app_role)
    OR has_role(auth.uid(), 'org_admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_maps_organisation_id ON public.maps(organisation_id);
CREATE INDEX idx_maps_created_by ON public.maps(created_by);
CREATE INDEX idx_dashboards_organisation_id ON public.dashboards(organisation_id);
CREATE INDEX idx_dashboards_created_by ON public.dashboards(created_by);
CREATE INDEX idx_dashboards_share_token ON public.dashboards(share_token) WHERE share_token IS NOT NULL;