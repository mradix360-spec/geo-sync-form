-- Add landing page configuration to organizations
ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS landing_config jsonb DEFAULT '{"title": "", "description": "", "logo_url": ""}'::jsonb;

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  action text NOT NULL,
  object_type text,
  object_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_org ON public.user_activity(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id, created_at DESC);

-- RLS Policy: Admins can view all activity in their organization
CREATE POLICY "Admins can view organization activity"
ON public.user_activity
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.organisation_id = user_activity.organisation_id
    AND ur.role IN ('super_admin', 'org_admin')
  )
);

-- RLS Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_action text,
  p_object_type text DEFAULT NULL,
  p_object_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_activity_id uuid;
BEGIN
  -- Get user's organization
  SELECT organisation_id INTO v_org_id
  FROM public.users
  WHERE id = p_user_id;
  
  -- Insert activity log
  INSERT INTO public.user_activity (
    user_id,
    organisation_id,
    action,
    object_type,
    object_id,
    details
  )
  VALUES (
    p_user_id,
    v_org_id,
    p_action,
    p_object_type,
    p_object_id,
    p_details
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;