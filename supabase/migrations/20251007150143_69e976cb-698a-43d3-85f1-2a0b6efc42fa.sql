-- Drop and recreate the function with properly qualified column names
DROP FUNCTION IF EXISTS public.get_forms_by_share_type(text);

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
  LEFT JOIN public.shares s ON s.object_id = f.id AND s.object_type = 'form'
  LEFT JOIN public.form_responses fr ON fr.form_id = f.id
  WHERE 
    share_filter IS NULL 
    OR COALESCE(s.access_type, 'private') = share_filter
  GROUP BY 
    f.id, 
    f.title, 
    f.description, 
    f.geometry_type, 
    f.is_published, 
    f.status, 
    f.created_at, 
    f.created_by, 
    f.organisation_id, 
    s.access_type
  ORDER BY f.created_at DESC;
END;
$$;