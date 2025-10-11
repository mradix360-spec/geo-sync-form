-- Fix the staff_count mismatch
UPDATE organisations 
SET staff_count = 6
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check if there are duplicate triggers that might be causing double increments
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users'
  AND t.tgname LIKE '%staff%'
ORDER BY t.tgname;