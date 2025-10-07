-- Add optimized indexes for stats queries
CREATE INDEX IF NOT EXISTS idx_form_responses_user_created 
ON form_responses(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_responses_user_id 
ON form_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_forms_status 
ON forms(status);

CREATE INDEX IF NOT EXISTS idx_form_assignments_user 
ON form_assignments(user_id);

-- Create optimized function for parallel stat aggregation
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_submissions,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_submissions,
    (SELECT COUNT(DISTINCT form_id) FROM form_assignments WHERE user_id = p_user_id) as assigned_forms
  FROM form_responses
  WHERE user_id = p_user_id;
END;
$$;