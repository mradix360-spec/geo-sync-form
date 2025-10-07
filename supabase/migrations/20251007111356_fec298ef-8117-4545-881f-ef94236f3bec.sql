-- Create security definer function to get user's organisation_id
CREATE OR REPLACE FUNCTION public.get_user_organisation_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.users WHERE id = _user_id;
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view users in their organisation" ON public.users;

-- Create new policy using the security definer function
CREATE POLICY "Users can view users in their organisation" 
ON public.users 
FOR SELECT 
USING (organisation_id = public.get_user_organisation_id(auth.uid()));