-- WARNING: This migration drops ALL RLS policies and DISABLES RLS on every non-system table in the public schema.
-- PostGIS system tables (spatial_ref_sys, geometry_columns, geography_columns) are excluded.

-- 1) Drop every RLS policy in the public schema (excluding PostGIS system tables)
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END$$;

-- 2) Disable RLS on all user tables in the public schema (excluding PostGIS system tables)
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', t.schemaname, t.tablename);
    -- Ensure FORCE RLS is also off if it was set
    EXECUTE format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY', t.schemaname, t.tablename);
  END LOOP;
END$$;