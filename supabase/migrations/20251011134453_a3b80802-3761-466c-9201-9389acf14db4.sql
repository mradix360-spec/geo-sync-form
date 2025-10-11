-- Recalculate staff_count for all organizations to fix sync issues
-- This counts only active users with the organization_id set

UPDATE organisations o
SET staff_count = (
  SELECT COUNT(*)
  FROM users u
  WHERE u.organisation_id = o.id
    AND u.is_active = true
);

-- Verify the counts are now correct
SELECT 
  o.id,
  o.name,
  o.staff_count as recorded_count,
  (SELECT COUNT(*) FROM users WHERE organisation_id = o.id AND is_active = true) as actual_count
FROM organisations o;