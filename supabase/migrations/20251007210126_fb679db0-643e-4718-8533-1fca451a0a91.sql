-- Create organisation_requests table
CREATE TABLE public.organisation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organisation_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  notes TEXT
);

-- Add status to organisations
ALTER TABLE public.organisations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create role_pricing table
CREATE TABLE public.role_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL UNIQUE,
  price_per_month NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert role pricing
INSERT INTO public.role_pricing (role, price_per_month) VALUES
  ('field_staff', 50000),
  ('analyst', 100000),
  ('org_admin', 150000);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table for revenue tracking
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  payment_method TEXT,
  payment_reference TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organisation_requests
CREATE POLICY "Users can view their own requests"
  ON public.organisation_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests"
  ON public.organisation_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all requests"
  ON public.organisation_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all requests"
  ON public.organisation_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for role_pricing
CREATE POLICY "Everyone can view role pricing"
  ON public.role_pricing FOR SELECT
  USING (true);

CREATE POLICY "Super admins can update role pricing"
  ON public.role_pricing FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for invoices
CREATE POLICY "Org admins can view their org invoices"
  ON public.invoices FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for payments
CREATE POLICY "Org admins can view their org payments"
  ON public.payments FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  inv_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-%';
  
  inv_number := 'INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN inv_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_pricing_updated_at
  BEFORE UPDATE ON public.role_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();