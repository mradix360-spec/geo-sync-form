-- Disable RLS and remove all policies from custom_widgets table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their org's custom widgets" ON custom_widgets;
DROP POLICY IF EXISTS "Users can create custom widgets for their org" ON custom_widgets;
DROP POLICY IF EXISTS "Users can update their org's custom widgets" ON custom_widgets;
DROP POLICY IF EXISTS "Users can delete their org's custom widgets" ON custom_widgets;

-- Disable RLS on the table
ALTER TABLE custom_widgets DISABLE ROW LEVEL SECURITY;