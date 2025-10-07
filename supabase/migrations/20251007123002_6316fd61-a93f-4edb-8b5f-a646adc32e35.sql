-- Improved RLS policies for field staff form access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view appropriate forms" ON forms;
DROP POLICY IF EXISTS "field_staff_assigned_forms" ON forms;

-- Create comprehensive policy for form viewing
CREATE POLICY "comprehensive_form_access" ON forms
  FOR SELECT TO authenticated
  USING (
    -- Super admins can see all forms
    has_role(auth.uid(), 'super_admin'::app_role)
    OR
    -- Org admins and analysts can see forms in their org
    (
      (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
      AND organisation_id IN (
        SELECT organisation_id FROM users WHERE id = auth.uid()
      )
    )
    OR
    -- Field staff can see published forms assigned to them
    (
      has_role(auth.uid(), 'field_staff'::app_role)
      AND status = 'published'
      AND id IN (
        SELECT form_id FROM form_assignments WHERE user_id = auth.uid()
      )
    )
  );

-- Add index for better performance on form assignments
CREATE INDEX IF NOT EXISTS idx_form_assignments_user_id ON form_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_form_id ON form_assignments(form_id);

-- Ensure form_responses policy is correct
DROP POLICY IF EXISTS "Users can view responses for forms in their organisation" ON form_responses;

CREATE POLICY "comprehensive_response_access" ON form_responses
  FOR SELECT TO authenticated
  USING (
    -- Users can view responses for forms they have access to
    form_id IN (
      SELECT id FROM forms WHERE
        -- Super admins see all
        has_role(auth.uid(), 'super_admin'::app_role)
        OR
        -- Org admins/analysts see their org's forms
        (
          (has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
          AND organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
        )
        OR
        -- Field staff see responses for forms assigned to them
        (
          has_role(auth.uid(), 'field_staff'::app_role)
          AND id IN (SELECT form_id FROM form_assignments WHERE user_id = auth.uid())
        )
    )
  );

COMMENT ON POLICY "comprehensive_form_access" ON forms IS 
'Allows super admins full access, org admins/analysts to see their org forms, and field staff to see assigned published forms';

COMMENT ON POLICY "comprehensive_response_access" ON form_responses IS 
'Users can view responses for forms they have permission to access based on their role';