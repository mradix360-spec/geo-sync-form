-- Add slug and landing page fields to organisations table
ALTER TABLE public.organisations 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS is_landing_enabled boolean DEFAULT false;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON public.organisations(slug);

-- Update landing_config to support enhanced customization
COMMENT ON COLUMN public.organisations.landing_config IS 'Landing page configuration including title, description, logo_url, banner_url, primary_color, secondary_color, cta_text, and features array';

-- Function to generate unique slugs from organization name
CREATE OR REPLACE FUNCTION public.generate_org_slug(org_name text, org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from org name (lowercase, replace non-alphanumeric with dashes)
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Handle empty slug
  IF base_slug = '' THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.organisations WHERE slug = final_slug AND id != org_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to auto-generate slug when organization is created or name changes
CREATE OR REPLACE FUNCTION public.auto_generate_org_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if slug is null or if name changed and slug matches old name pattern
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := public.generate_org_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_org_slug
BEFORE INSERT OR UPDATE OF name ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_org_slug();

-- Generate slugs for existing organizations
UPDATE public.organisations 
SET slug = public.generate_org_slug(name, id)
WHERE slug IS NULL;