-- Create form_groups table for group-based sharing
CREATE TABLE IF NOT EXISTS public.form_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable RLS on form_groups
ALTER TABLE public.form_groups ENABLE ROW LEVEL SECURITY;

-- Create form_group_members table
CREATE TABLE IF NOT EXISTS public.form_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.form_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on form_group_members
ALTER TABLE public.form_group_members ENABLE ROW LEVEL SECURITY;

-- Add group_id to shares table
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.form_groups(id) ON DELETE CASCADE;

-- Add shared_with_organisation for cross-org sharing
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS shared_with_organisation uuid REFERENCES public.organisations(id) ON DELETE CASCADE;

-- RLS Policies for form_groups
CREATE POLICY "Users can view groups in their organisation"
  ON public.form_groups FOR SELECT
  USING (organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can create groups"
  ON public.form_groups FOR INSERT
  WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Org admins can update their org's groups"
  ON public.form_groups FOR UPDATE
  USING (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Org admins can delete their org's groups"
  ON public.form_groups FOR DELETE
  USING (
    organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

-- RLS Policies for form_group_members
CREATE POLICY "Users can view members of groups in their org"
  ON public.form_group_members FOR SELECT
  USING (group_id IN (
    SELECT id FROM public.form_groups 
    WHERE organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
  ));

CREATE POLICY "Org admins can manage group members"
  ON public.form_group_members FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.form_groups 
      WHERE organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    )
    AND (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

-- Update shares RLS policies to support new access types
DROP POLICY IF EXISTS "Users can create shares for their forms" ON public.shares;
CREATE POLICY "Form creators can create shares"
  ON public.shares FOR INSERT
  WITH CHECK (
    object_id IN (SELECT id FROM public.forms WHERE created_by = auth.uid())
    AND (
      access_type IN ('private', 'public', 'organisation')
      OR (access_type = 'group' AND group_id IS NOT NULL)
      OR (access_type = 'other_organisation' AND shared_with_organisation IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Users can view shares they created or own" ON public.shares;
CREATE POLICY "Users can view relevant shares"
  ON public.shares FOR SELECT
  USING (
    -- Form creators can see all shares
    object_id IN (SELECT id FROM public.forms WHERE created_by = auth.uid())
    -- Users can see shares directly assigned to them
    OR shared_with_user = auth.uid()
    -- Users can see public shares
    OR access_type = 'public'
    -- Users can see shares for their organisation
    OR (access_type = 'organisation' AND organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    ))
    -- Users can see shares for groups they're in
    OR (access_type = 'group' AND group_id IN (
      SELECT group_id FROM public.form_group_members WHERE user_id = auth.uid()
    ))
    -- Users can see shares from other organisations shared with their org
    OR (access_type = 'other_organisation' AND shared_with_organisation IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    ))
  );

-- Function to get forms with share information
CREATE OR REPLACE FUNCTION public.get_forms_by_share_type(share_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  geometry_type text,
  is_published boolean,
  status text,
  created_at timestamptz,
  created_by uuid,
  organisation_id uuid,
  share_type text,
  response_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.title,
    f.description,
    f.geometry_type,
    f.is_published,
    f.status,
    f.created_at,
    f.created_by,
    f.organisation_id,
    COALESCE(s.access_type, 'private') as share_type,
    COUNT(fr.id) as response_count
  FROM public.forms f
  LEFT JOIN public.shares s ON s.object_id = f.id
  LEFT JOIN public.form_responses fr ON fr.form_id = f.id
  WHERE 
    -- User can see forms in their org
    (f.organisation_id IN (SELECT organisation_id FROM public.users WHERE id = auth.uid()))
    -- Or forms shared with them
    OR (s.shared_with_user = auth.uid())
    -- Or public forms
    OR (s.access_type = 'public')
    -- Or forms shared with their organisation
    OR (s.access_type = 'organisation' AND s.organisation_id IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    ))
    -- Or forms shared with groups they're in
    OR (s.access_type = 'group' AND s.group_id IN (
      SELECT group_id FROM public.form_group_members WHERE user_id = auth.uid()
    ))
    -- Or forms from other organisations
    OR (s.access_type = 'other_organisation' AND s.shared_with_organisation IN (
      SELECT organisation_id FROM public.users WHERE id = auth.uid()
    ))
  AND (
    share_filter IS NULL 
    OR COALESCE(s.access_type, 'private') = share_filter
  )
  GROUP BY f.id, f.title, f.description, f.geometry_type, f.is_published, 
           f.status, f.created_at, f.created_by, f.organisation_id, s.access_type
  ORDER BY f.created_at DESC;
END;
$$;