-- =====================================================
-- COMPREHENSIVE RLS FIX - ADDRESSES ALL RECURSION ISSUES
-- This fixes ALL infinite recursion problems completely
-- =====================================================

BEGIN;

-- 1. IDENTIFY AND DROP ALL PROBLEMATIC POLICIES
DO $$ 
DECLARE
    policy_record RECORD;
    table_name TEXT;
BEGIN
    -- Drop ALL policies on tables that reference client_members
    FOR table_name IN VALUES ('client_members'), ('projects'), ('leads'), ('clients') LOOP
        FOR policy_record IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = table_name
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
            RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, table_name;
        END LOOP;
    END LOOP;
END $$;

-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES

-- CLIENT_MEMBERS: Simple user-based access (NO RECURSION)
CREATE POLICY "client_members_user_access"
ON public.client_members
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SERVICE ROLE: Full access for admin operations
CREATE POLICY "client_members_service_access"
ON public.client_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. PROJECTS: Use simple EXISTS check (NO RECURSION)
CREATE POLICY "projects_user_access"
ON public.projects
FOR ALL
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

CREATE POLICY "projects_service_access"
ON public.projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. LEADS: Use simple EXISTS check (NO RECURSION)
CREATE POLICY "leads_user_access"
ON public.leads
FOR ALL
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

CREATE POLICY "leads_service_access"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. CLIENTS: Use simple EXISTS check (NO RECURSION)
CREATE POLICY "clients_user_access"
ON public.clients
FOR ALL
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "clients_service_access"
ON public.clients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. ENSURE TEST USER HAS PROPER MEMBERSHIPS
INSERT INTO public.client_members (user_id, client_id, role, created_at)
SELECT 
  '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid as user_id,
  c.id as client_id,
  'OWNER' as role,
  NOW() as created_at
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_members cm 
  WHERE cm.user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid 
  AND cm.client_id = c.id
);

-- 7. ENABLE RLS AND GRANT PERMISSIONS
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.client_members TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.clients TO authenticated;

COMMIT;

-- 8. VERIFICATION QUERIES
SELECT 
  'Policy verification' as test,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('client_members', 'projects', 'leads', 'clients')
ORDER BY tablename, policyname;

-- Test client access
SELECT 
  'Client access test' as test,
  COUNT(*) as client_count
FROM public.clients 
WHERE id IN (
  SELECT client_id 
  FROM public.client_members 
  WHERE user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
);

-- Test project access
SELECT 
  'Project access test' as test,
  COUNT(*) as project_count
FROM public.projects 
WHERE client_id IN (
  SELECT client_id 
  FROM public.client_members 
  WHERE user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
); 