-- PRODUCTION-READY RLS SETUP
-- Best practices for reliable, secure Row Level Security

-- =====================================================
-- STEP 1: CLEAN SLATE - Remove all existing policies
-- =====================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL existing policies to start fresh
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('client_members', 'projects', 'leads', 'conversations', 'clients')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CORE RLS POLICIES - Simple and Reliable
-- =====================================================

-- CLIENT_MEMBERS: Foundation table - must work perfectly
CREATE POLICY "client_members_select_own" 
ON public.client_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "client_members_insert_own" 
ON public.client_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "client_members_update_own" 
ON public.client_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CLIENTS: Access via membership
CREATE POLICY "clients_select_via_membership" 
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

-- PROJECTS: Access via client membership  
CREATE POLICY "projects_select_via_client_membership" 
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

-- LEADS: Access via client membership
CREATE POLICY "leads_select_via_client_membership" 
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

-- =====================================================
-- STEP 3: FALLBACK POLICIES - For edge cases
-- =====================================================

-- Service role bypass (for admin operations)
CREATE POLICY "service_role_full_access_client_members" 
ON public.client_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_full_access_projects" 
ON public.projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 4: EMERGENCY BYPASS FUNCTION (Use carefully!)
-- =====================================================

-- Create function to temporarily disable RLS for debugging
CREATE OR REPLACE FUNCTION public.emergency_disable_rls()
RETURNS TEXT AS $$
BEGIN
  -- Only allow in development
  IF current_setting('app.environment', true) = 'development' THEN
    ALTER TABLE public.client_members DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
    RETURN 'RLS disabled for debugging';
  ELSE
    RETURN 'RLS disable not allowed in production';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to re-enable RLS
CREATE OR REPLACE FUNCTION public.emergency_enable_rls()
RETURNS TEXT AS $$
BEGIN
  ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
  RETURN 'RLS re-enabled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: VERIFICATION & MONITORING
-- =====================================================

-- Create view to monitor RLS policies
CREATE OR REPLACE VIEW public.rls_policy_monitor AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Grant permissions
GRANT SELECT ON public.rls_policy_monitor TO authenticated;

-- =====================================================
-- STEP 6: TESTING FUNCTION
-- =====================================================

-- Function to test RLS for current user
CREATE OR REPLACE FUNCTION public.test_rls_access()
RETURNS TABLE(
  table_name TEXT,
  can_access BOOLEAN,
  record_count BIGINT,
  error_message TEXT
) AS $$
BEGIN
  -- Test client_members
  BEGIN
    SELECT COUNT(*) INTO record_count FROM public.client_members;
    table_name := 'client_members';
    can_access := true;
    error_message := NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    table_name := 'client_members';
    can_access := false;
    record_count := 0;
    error_message := SQLERRM;
    RETURN NEXT;
  END;
  
  -- Test projects
  BEGIN
    SELECT COUNT(*) INTO record_count FROM public.projects;
    table_name := 'projects';
    can_access := true;
    error_message := NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    table_name := 'projects';
    can_access := false;
    record_count := 0;
    error_message := SQLERRM;
    RETURN NEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.test_rls_access() TO authenticated;

-- =====================================================
-- FINAL: Verify setup
-- =====================================================
SELECT 'RLS Setup Complete' as status;
SELECT * FROM public.rls_policy_monitor; 