-- Fix RLS Policies for Client Access Issue
-- This script ensures authenticated users can access their client_members properly

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their client memberships" ON public.client_members;
DROP POLICY IF EXISTS "Users can manage their client memberships" ON public.client_members;
DROP POLICY IF EXISTS "Select own client memberships" ON public.client_members;
DROP POLICY IF EXISTS "client_members_own_access" ON public.client_members;
DROP POLICY IF EXISTS "Users can read client memberships they belong to" ON public.client_members;

-- 2. Create simple, working policies for client_members
CREATE POLICY "authenticated_users_can_read_own_memberships" 
ON public.client_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "authenticated_users_can_manage_own_memberships" 
ON public.client_members
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Fix projects RLS policy
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can read their projects" ON public.projects;
DROP POLICY IF EXISTS "projects_via_client_membership" ON public.projects;

CREATE POLICY "authenticated_users_can_read_accessible_projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

-- 4. Fix leads RLS policy
DROP POLICY IF EXISTS "Users can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can read their leads" ON public.leads;

CREATE POLICY "authenticated_users_can_read_accessible_leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

-- 5. Grant necessary permissions
GRANT SELECT ON public.client_members TO authenticated;
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.clients TO authenticated;

-- 6. Verify the policies work
SELECT 
  'RLS Policy Check' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('client_members', 'projects', 'leads')
ORDER BY tablename, policyname; 