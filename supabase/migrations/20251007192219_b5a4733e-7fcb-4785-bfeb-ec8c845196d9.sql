-- Phase 1 & 5: Add spatial indexes for performance optimization
-- Create spatial index on form_responses geometry for fast bbox queries
CREATE INDEX IF NOT EXISTS idx_form_responses_geom_gist 
ON form_responses USING GIST (geom);

-- Add index on shares token for fast public token lookups
CREATE INDEX IF NOT EXISTS idx_shares_token 
ON shares(token) WHERE access_type = 'public' AND object_type = 'form';

-- Add index on form_responses for temporal queries
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at 
ON form_responses(created_at DESC);

-- Add composite index for form filtering
CREATE INDEX IF NOT EXISTS idx_form_responses_form_synced 
ON form_responses(form_id, synced);

-- Function to validate and get form from share token
CREATE OR REPLACE FUNCTION get_form_from_share_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_id uuid;
BEGIN
  SELECT object_id INTO v_form_id
  FROM shares
  WHERE token = p_token
    AND object_type = 'form'
    AND access_type = 'public'
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN v_form_id;
END;
$$;