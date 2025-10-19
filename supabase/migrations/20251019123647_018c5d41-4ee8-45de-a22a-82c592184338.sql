-- Drop all RLS policies from assets table
DROP POLICY IF EXISTS "Users can view assets in their organization" ON public.assets;
DROP POLICY IF EXISTS "Admins and analysts can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Admins and analysts can update assets" ON public.assets;
DROP POLICY IF EXISTS "Admins and analysts can delete assets" ON public.assets;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies from inspection_tasks table
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.inspection_tasks;
DROP POLICY IF EXISTS "Admins and analysts can manage tasks" ON public.inspection_tasks;
ALTER TABLE public.inspection_tasks DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies from task_assignments table
DROP POLICY IF EXISTS "Users can view their assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Admins and analysts can manage assignments" ON public.task_assignments;
ALTER TABLE public.task_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies from inspection_responses table
DROP POLICY IF EXISTS "Users can view responses in their organization" ON public.inspection_responses;
DROP POLICY IF EXISTS "Assigned users can create responses" ON public.inspection_responses;
ALTER TABLE public.inspection_responses DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies from asset_imports table
DROP POLICY IF EXISTS "Users can view imports in their organization" ON public.asset_imports;
DROP POLICY IF EXISTS "Admins and analysts can create imports" ON public.asset_imports;
ALTER TABLE public.asset_imports DISABLE ROW LEVEL SECURITY;

-- Drop storage policies for asset-models bucket
DROP POLICY IF EXISTS "Users can view models in their org" ON storage.objects;
DROP POLICY IF EXISTS "Admins and analysts can upload models" ON storage.objects;

-- Drop storage policies for inspection-photos bucket
DROP POLICY IF EXISTS "Users can view photos in their org" ON storage.objects;
DROP POLICY IF EXISTS "Field staff can upload photos" ON storage.objects;