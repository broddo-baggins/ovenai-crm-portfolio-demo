-- 🔄 SITE DB ROLLBACK PLAN: Restore Original RLS Policies
-- Target: ajszzemkpenbfnghqiyz.supabase.co (Site DB - Production UI)
-- 
-- Use this script ONLY if the site-db-rls-fix.sql causes issues
-- This will restore the original policies that were shown by the user

-- STEP 1: Remove our fixed policies
DO $$ 
BEGIN
  RAISE NOTICE '🔄 ROLLING BACK SITE DB RLS POLICY CHANGES';
  RAISE NOTICE 'Restoring original policies...';
END $$;

-- Remove our new policies
DROP POLICY IF EXISTS "conversations_authenticated_access" ON public.conversations;
DROP POLICY IF EXISTS "leads_authenticated_access" ON public.leads;
DROP POLICY IF EXISTS "conversations_service_role_access" ON public.conversations;
DROP POLICY IF EXISTS "leads_service_role_access" ON public.leads;
DROP POLICY IF EXISTS "clients_authenticated_access" ON public.clients;
DROP POLICY IF EXISTS "projects_authenticated_access" ON public.projects;

-- STEP 2: Restore original conversation policies (as shown by user)
CREATE POLICY "authenticated_users_all_conversations"
ON public.conversations
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_read_conversations"
ON public.conversations
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can delete conversations they own"
ON public.conversations
FOR DELETE
TO public
USING (true);

CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
TO public
USING (true);

CREATE POLICY "Users can insert new conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read conversations they have membership in"
ON public.conversations
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update conversations they own"
ON public.conversations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- STEP 3: Restore original lead policies
CREATE POLICY "authenticated_users_all_leads"
ON public.leads
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_read_leads"
ON public.leads
FOR SELECT
TO public
USING (true);

CREATE POLICY "leads_current_project_access"
ON public.leads
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "leads_insert_policy"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "leads_select_policy"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "leads_service_role_policy"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "leads_update_policy"
ON public.leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can create leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can delete leads they own"
ON public.leads
FOR DELETE
TO public
USING (true);

CREATE POLICY "Users can delete their leads"
ON public.leads
FOR DELETE
TO public
USING (true);

CREATE POLICY "Users can edit their leads"
ON public.leads
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can insert new leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can read leads they have membership in"
ON public.leads
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update leads they own"
ON public.leads
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can update their leads"
ON public.leads
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- STEP 4: Restore original client policies
CREATE POLICY "authenticated_users_all_clients"
ON public.clients
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_read_clients"
ON public.clients
FOR SELECT
TO public
USING (true);

-- STEP 5: Restore original project policies
CREATE POLICY "authenticated_users_all_projects"
ON public.projects
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_users_read_projects"
ON public.projects
FOR SELECT
TO public
USING (true);

-- STEP 6: Remove diagnostic function
DROP FUNCTION IF EXISTS site_db_access_diagnostics();

-- STEP 7: Confirm rollback
SELECT 
  '✅ ROLLBACK COMPLETE' as status,
  'Original RLS policies restored' as action,
  'If Messages page still shows issues, the problem is deeper' as note,
  NOW() as rolled_back_at; 