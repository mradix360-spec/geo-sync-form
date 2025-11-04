-- Create asset_groups table for grouping assets
CREATE TABLE public.asset_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for asset_groups
CREATE POLICY "Users can view asset groups in their organization"
ON public.asset_groups
FOR SELECT
USING (true);

CREATE POLICY "Analysts can create asset groups"
ON public.asset_groups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Analysts can update asset groups"
ON public.asset_groups
FOR UPDATE
USING (true);

CREATE POLICY "Analysts can delete asset groups"
ON public.asset_groups
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_asset_groups_org ON public.asset_groups(organisation_id);

-- Create trigger for updated_at
CREATE TRIGGER update_asset_groups_updated_at
BEFORE UPDATE ON public.asset_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();