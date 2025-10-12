-- Create custom_widgets table for organization-specific widgets
CREATE TABLE IF NOT EXISTS public.custom_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id),
  name TEXT NOT NULL,
  description TEXT,
  widget_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's custom widgets"
  ON public.custom_widgets FOR SELECT
  USING (organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create custom widgets for their org"
  ON public.custom_widgets FOR INSERT
  WITH CHECK (organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org's custom widgets"
  ON public.custom_widgets FOR UPDATE
  USING (organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's custom widgets"
  ON public.custom_widgets FOR DELETE
  USING (organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  ));

-- Index for performance
CREATE INDEX idx_custom_widgets_org ON public.custom_widgets(organisation_id);
CREATE INDEX idx_custom_widgets_type ON public.custom_widgets(widget_type);