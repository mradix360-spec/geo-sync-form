-- Update function to count assigned forms correctly
-- Counts forms explicitly assigned to user OR published forms in their organization
CREATE OR REPLACE FUNCTION get_user_field_stats(p_user_id uuid)
RETURNS TABLE (
  total_submissions bigint,
  today_submissions bigint,
  week_submissions bigint,
  assigned_forms bigint
) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get user's organization
  SELECT organisation_id INTO v_org_id FROM users WHERE id = p_user_id;
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_submissions,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_submissions,
    (
      SELECT COUNT(DISTINCT f.id)
      FROM forms f
      WHERE f.is_published = true
        AND f.organisation_id = v_org_id
    ) as assigned_forms
  FROM form_responses
  WHERE user_id = p_user_id;
END;
$$;