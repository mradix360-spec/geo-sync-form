-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the count of existing invoices and add 1
  SELECT COUNT(*) + 1 INTO next_number FROM invoices;
  
  -- Format as INV-YYYY-NNNN
  invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$;

-- Seed role_pricing table with default values (in TZS)
INSERT INTO public.role_pricing (role, price_per_month, currency) VALUES
  ('field_staff', 50000, 'TZS'),
  ('analyst', 100000, 'TZS'),
  ('org_admin', 150000, 'TZS')
ON CONFLICT DO NOTHING;

-- Add RLS policy for org admins to view their organization's invoices
CREATE POLICY "Org admins can view their org invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id 
    FROM users 
    WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'org_admin'
  )
);

-- Add policy for org admins to view payments for their organization
CREATE POLICY "Org admins can view their org payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id 
    FROM users 
    WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'org_admin'
  )
);