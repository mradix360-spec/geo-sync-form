-- Drop old triggers and functions
DROP TRIGGER IF EXISTS sync_staff_count_insert ON public.users;
DROP TRIGGER IF EXISTS sync_staff_count_update ON public.users;
DROP TRIGGER IF EXISTS sync_staff_count_delete ON public.users;
DROP TRIGGER IF EXISTS sync_staff_count ON public.users;
DROP FUNCTION IF EXISTS public.sync_staff_count();
DROP FUNCTION IF EXISTS public.increment_organisation_staff_count();
DROP FUNCTION IF EXISTS public.update_organisation_staff_count();
DROP FUNCTION IF EXISTS public.recalculate_all_staff_counts();

-- Optimized INSERT function using transition tables
CREATE OR REPLACE FUNCTION public.sync_staff_count_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.organisations o
  SET staff_count = staff_count + inc.count
  FROM (
    SELECT organisation_id, COUNT(*) AS count
    FROM new_table
    WHERE organisation_id IS NOT NULL AND is_active = true
    GROUP BY organisation_id
  ) AS inc
  WHERE o.id = inc.organisation_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Optimized DELETE function using transition tables
CREATE OR REPLACE FUNCTION public.sync_staff_count_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.organisations o
  SET staff_count = GREATEST(0, staff_count - dec.count)
  FROM (
    SELECT organisation_id, COUNT(*) AS count
    FROM old_table
    WHERE organisation_id IS NOT NULL AND is_active = true
    GROUP BY organisation_id
  ) AS dec
  WHERE o.id = dec.organisation_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Optimized UPDATE function using transition tables
CREATE OR REPLACE FUNCTION public.sync_staff_count_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement for old active users
  UPDATE public.organisations o
  SET staff_count = GREATEST(0, staff_count - dec.count)
  FROM (
    SELECT organisation_id, COUNT(*) AS count
    FROM old_table
    WHERE organisation_id IS NOT NULL AND is_active = true
    GROUP BY organisation_id
  ) AS dec
  WHERE o.id = dec.organisation_id;

  -- Increment for new active users
  UPDATE public.organisations o
  SET staff_count = staff_count + inc.count
  FROM (
    SELECT organisation_id, COUNT(*) AS count
    FROM new_table
    WHERE organisation_id IS NOT NULL AND is_active = true
    GROUP BY organisation_id
  ) AS inc
  WHERE o.id = inc.organisation_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Batch triggers (FOR EACH STATEMENT, not FOR EACH ROW)
CREATE TRIGGER sync_staff_count_insert
  AFTER INSERT ON public.users
  REFERENCING NEW TABLE AS new_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.sync_staff_count_insert();

CREATE TRIGGER sync_staff_count_delete
  AFTER DELETE ON public.users
  REFERENCING OLD TABLE AS old_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.sync_staff_count_delete();

CREATE TRIGGER sync_staff_count_update
  AFTER UPDATE ON public.users
  REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.sync_staff_count_update();

-- Periodic integrity recalculation (used rarely)
CREATE OR REPLACE FUNCTION public.recalculate_all_staff_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.organisations o
  SET staff_count = (
    SELECT COUNT(*) FROM public.users u
    WHERE u.organisation_id = o.id AND u.is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Critical index for efficient aggregation
CREATE INDEX IF NOT EXISTS idx_users_org_active
  ON public.users (organisation_id)
  WHERE is_active = true;

-- Initial sync
SELECT public.recalculate_all_staff_counts();