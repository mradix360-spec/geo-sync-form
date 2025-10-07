-- Function to generate random share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Function to auto-generate token for public shares
CREATE OR REPLACE FUNCTION auto_generate_share_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate token if access_type is 'public' and token is null
  IF NEW.access_type = 'public' AND NEW.token IS NULL THEN
    NEW.token = generate_share_token();
  END IF;
  
  -- Clear token if changing from public to another type
  IF NEW.access_type != 'public' AND OLD.token IS NOT NULL THEN
    NEW.token = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for shares table
DROP TRIGGER IF EXISTS shares_auto_token_trigger ON shares;
CREATE TRIGGER shares_auto_token_trigger
  BEFORE INSERT OR UPDATE ON shares
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_share_token();

-- Add index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token) WHERE token IS NOT NULL;