-- =====================================================
-- MANUAL RLS FIX - Copy and paste this entire script
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- STEP 1: Clean up existing problematic policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their client memberships" ON public.client_members;
DROP POLICY IF EXISTS "Users can manage their client memberships" ON public.client_members;
DROP POLICY IF EXISTS "Select own client memberships" ON public.client_members;
DROP POLICY IF EXISTS "client_members_own_access" ON public.client_members;
DROP POLICY IF EXISTS "client_members_insert_access" ON public.client_members;
DROP POLICY IF EXISTS "Users can read client memberships they belong to" ON public.client_members;
DROP POLICY IF EXISTS "authenticated_users_can_read_own_memberships" ON public.client_members;
DROP POLICY IF EXISTS "authenticated_users_can_manage_own_memberships" ON public.client_members;

-- Projects policies cleanup
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can read their projects" ON public.projects;
DROP POLICY IF EXISTS "projects_via_client_membership" ON public.projects;
DROP POLICY IF EXISTS "authenticated_users_can_read_accessible_projects" ON public.projects;

-- Leads policies cleanup  
DROP POLICY IF EXISTS "Users can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can read their leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_users_can_read_accessible_leads" ON public.leads;

-- STEP 2: Create simple, working policies
-- =====================================================

-- CLIENT_MEMBERS: Foundation table - must work
CREATE POLICY "client_members_select_policy" 
ON public.client_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "client_members_insert_policy" 
ON public.client_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "client_members_update_policy" 
ON public.client_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "client_members_delete_policy" 
ON public.client_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- SERVICE ROLE bypass for client_members
CREATE POLICY "client_members_service_role_policy" 
ON public.client_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PROJECTS: Access via client membership
CREATE POLICY "projects_select_policy" 
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

CREATE POLICY "projects_insert_policy" 
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_update_policy" 
ON public.projects
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

-- SERVICE ROLE bypass for projects
CREATE POLICY "projects_service_role_policy" 
ON public.projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- LEADS: Access via client membership
CREATE POLICY "leads_select_policy" 
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

CREATE POLICY "leads_insert_policy" 
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "leads_update_policy" 
ON public.leads
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

-- SERVICE ROLE bypass for leads
CREATE POLICY "leads_service_role_policy" 
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- CLIENTS: Access via membership (if needed)
CREATE POLICY "clients_select_policy" 
ON public.clients
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

-- SERVICE ROLE bypass for clients
CREATE POLICY "clients_service_role_policy" 
ON public.clients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 3: Ensure RLS is enabled on all tables
-- =====================================================
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- STEP 4: Grant necessary permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT ON public.clients TO authenticated;

-- STEP 5: Verification query
-- =====================================================
SELECT 
  'Policy Check' as status,
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('client_members', 'projects', 'leads', 'clients')
ORDER BY tablename, cmd, policyname;

-- Test query to verify it works
SELECT 'RLS Fix Complete - Test this query in your app:' as message;
SELECT 'SELECT * FROM client_members WHERE user_id = auth.uid();' as test_query; 