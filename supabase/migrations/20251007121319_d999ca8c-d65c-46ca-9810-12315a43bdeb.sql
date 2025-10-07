-- Enable RLS on maps table (if not already enabled)
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Enable RLS on dashboards table (if not already enabled)
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;