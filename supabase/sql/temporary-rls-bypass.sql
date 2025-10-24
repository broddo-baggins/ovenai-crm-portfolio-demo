-- =============================================
-- TEMPORARY RLS BYPASS
-- =============================================
-- This temporarily disables RLS to make the system work while we fix the policies

BEGIN;

-- OPTION 1: Completely disable RLS temporarily  
-- (Use this if you need the system working immediately)
/*
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
*/

-- OPTION 2: Create permissive policies that allow all operations for authenticated users
-- (Better security than Option 1, but still permissive)

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can read clients they have membership in" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients they own" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients they own" ON public.clients;

DROP POLICY IF EXISTS "Users can read projects they have membership in" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they own" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects they own" ON public.projects;

DROP POLICY IF EXISTS "Users can read leads they have membership in" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads they own" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads they own" ON public.leads;

DROP POLICY IF EXISTS "Users can read conversations they have membership in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they own" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete conversations they own" ON public.conversations;

-- Create simple permissive policies for authenticated users
-- These allow any authenticated user to perform operations

-- CLIENT POLICIES - Permissive
CREATE POLICY "clients_select_authenticated"
    ON public.clients FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_insert_authenticated"
    ON public.clients FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clients_update_authenticated"
    ON public.clients FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clients_delete_authenticated"
    ON public.clients FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- PROJECT POLICIES - Permissive
CREATE POLICY "projects_select_authenticated"
    ON public.projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_insert_authenticated"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "projects_update_authenticated"
    ON public.projects FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "projects_delete_authenticated"
    ON public.projects FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- LEAD POLICIES - Permissive
CREATE POLICY "leads_select_authenticated"
    ON public.leads FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "leads_insert_authenticated"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_update_authenticated"
    ON public.leads FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_delete_authenticated"
    ON public.leads FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- CONVERSATION POLICIES - Permissive
CREATE POLICY "conversations_select_authenticated"
    ON public.conversations FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_insert_authenticated"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_update_authenticated"
    ON public.conversations FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_delete_authenticated"
    ON public.conversations FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Keep membership table policies simple too
DROP POLICY IF EXISTS "Users can read client memberships they belong to" ON public.client_members;
DROP POLICY IF EXISTS "Users can read project memberships they belong to" ON public.project_members;
DROP POLICY IF EXISTS "Users can read lead memberships they belong to" ON public.lead_members;
DROP POLICY IF EXISTS "Users can read conversation memberships they belong to" ON public.conversation_members;

CREATE POLICY "client_members_all_authenticated"
    ON public.client_members FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "project_members_all_authenticated"
    ON public.project_members FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "lead_members_all_authenticated"
    ON public.lead_members FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversation_members_all_authenticated"
    ON public.conversation_members FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;

-- Force schema refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Test query
SELECT 
    'Temporary RLS bypass applied' as status,
    'All authenticated users can now perform CRUD operations' as note,
    NOW() as timestamp; 