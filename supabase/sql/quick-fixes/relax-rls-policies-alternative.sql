-- 🔓 ALTERNATIVE: RELAX RLS POLICIES (LESS SECURE)
-- This removes the membership requirements and allows any authenticated user to access data
-- ⚠️  WARNING: This reduces security but fixes access issues immediately

-- STEP 1: Remove restrictive conversation policies
DROP POLICY IF EXISTS "Users can read their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view accessible conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_authenticated_access" ON public.conversations;

-- STEP 2: Create relaxed conversation policy
CREATE POLICY "authenticated_users_can_access_conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- STEP 3: Remove restrictive lead policies  
DROP POLICY IF EXISTS "Users can read their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view accessible leads" ON public.leads;
DROP POLICY IF EXISTS "leads_authenticated_access" ON public.leads;

-- STEP 4: Create relaxed lead policy
CREATE POLICY "authenticated_users_can_access_leads"
ON public.leads
FOR ALL  
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- STEP 5: Remove restrictive client policies
DROP POLICY IF EXISTS "Users can read clients they have membership in" ON public.clients;
DROP POLICY IF EXISTS "clients_authenticated_access" ON public.clients;

-- STEP 6: Create relaxed client policy
CREATE POLICY "authenticated_users_can_access_clients"
ON public.clients
FOR ALL
TO authenticated  
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- STEP 7: Remove restrictive project policies
DROP POLICY IF EXISTS "Users can read projects they have membership in" ON public.projects;
DROP POLICY IF EXISTS "projects_authenticated_access" ON public.projects;

-- STEP 8: Create relaxed project policy
CREATE POLICY "authenticated_users_can_access_projects"
ON public.projects
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)  
WITH CHECK (auth.uid() IS NOT NULL);

-- STEP 9: Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- STEP 10: Verify the relaxed policies
SELECT 
    'RLS policies relaxed' as status,
    'Any authenticated user can now access data' as result,
    'WARNING: Security reduced - consider membership approach instead' as warning,
    NOW() as applied_at; 