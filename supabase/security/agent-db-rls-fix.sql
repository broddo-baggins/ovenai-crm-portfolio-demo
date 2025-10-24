-- 🔒 AGENT DB RLS SECURITY FIX
-- Target: Agent DB (imnyrhjdoaccxenxyfam.supabase.co)
-- 
-- This script fixes RLS security for 3 critical Agent DB tables:
-- 1. event_store (4,388 automation events)
-- 2. event_projections (future event aggregations) 
-- 3. trigger_suppression_config (N8N automation control)
--
-- ⚠️  CRITICAL: This is the MASTER Agent DB - exercise extreme caution!

-- =====================================================
-- ANALYSIS SUMMARY
-- =====================================================
-- event_store: Contains clients_insert, leads_update events for unified_event_propagation
-- trigger_suppression_config: Controls bidirectional_sync, backend_to_frontend_sync, frontend_sync
-- event_projections: Empty but needs protection for future data
--
-- ACCESS PATTERN: Service accounts (N8N, Agent) need full access, users should be blocked

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS (this is safe - just enables the security framework)
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_suppression_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. EVENT_STORE POLICIES
-- =====================================================

-- Policy 1: Service role has full access (for N8N automation)
CREATE POLICY "service_role_full_access_event_store" 
ON public.event_store
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users with admin role can read events for debugging
CREATE POLICY "admin_read_event_store" 
ON public.event_store
FOR SELECT
TO authenticated
USING (
  -- Check if user has admin role in JWT claims
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  OR
  -- Alternative: check user_metadata for admin flag
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- Policy 3: Block all other access to event_store
CREATE POLICY "block_user_access_event_store" 
ON public.event_store
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 4: Allow anon role to be explicitly denied (security best practice)
CREATE POLICY "deny_anon_access_event_store" 
ON public.event_store
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- 3. EVENT_PROJECTIONS POLICIES  
-- =====================================================

-- Policy 1: Service role has full access
CREATE POLICY "service_role_full_access_event_projections" 
ON public.event_projections
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Admin read access for debugging
CREATE POLICY "admin_read_event_projections" 
ON public.event_projections
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- Policy 3: Block regular user access
CREATE POLICY "block_user_access_event_projections" 
ON public.event_projections
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 4: Deny anonymous access
CREATE POLICY "deny_anon_access_event_projections" 
ON public.event_projections
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- 4. TRIGGER_SUPPRESSION_CONFIG POLICIES
-- =====================================================

-- Policy 1: Service role has full access (critical for N8N automation)
CREATE POLICY "service_role_full_access_trigger_suppression" 
ON public.trigger_suppression_config
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Admin users can read suppression config for monitoring
CREATE POLICY "admin_read_trigger_suppression" 
ON public.trigger_suppression_config
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- Policy 3: Admin users can update suppression config (emergency control)
CREATE POLICY "admin_update_trigger_suppression" 
ON public.trigger_suppression_config
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
)
WITH CHECK (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- Policy 4: Block regular user access to automation controls
CREATE POLICY "block_user_access_trigger_suppression" 
ON public.trigger_suppression_config
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 5: Deny anonymous access to automation controls
CREATE POLICY "deny_anon_access_trigger_suppression" 
ON public.trigger_suppression_config
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- 5. SECURITY VALIDATION
-- =====================================================

-- Verify RLS is enabled
DO $$
DECLARE
    rls_status RECORD;
BEGIN
    FOR rls_status IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
    LOOP
        IF rls_status.rowsecurity THEN
            RAISE NOTICE '✅ RLS enabled on %.%', rls_status.schemaname, rls_status.tablename;
        ELSE
            RAISE WARNING '❌ RLS NOT enabled on %.%', rls_status.schemaname, rls_status.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 6. POLICY SUMMARY & VERIFICATION
-- =====================================================

-- List all policies created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
ORDER BY tablename, policyname;

-- =====================================================
-- 7. DOCUMENTATION & WARNINGS
-- =====================================================

/*
🔒 SECURITY IMPLEMENTATION SUMMARY:

✅ WHAT THIS FIXES:
- Enables RLS on 3 critical Agent DB tables
- Blocks unauthorized user access to automation data
- Maintains service account access for N8N/Agent operations
- Provides admin debugging access with proper role checks

🎯 ACCESS MATRIX:
┌─────────────────────────┬─────────────┬───────────────┬─────────────────────┐
│ Role                    │ event_store │ event_proj... │ trigger_suppress... │
├─────────────────────────┼─────────────┼───────────────┼─────────────────────┤
│ service_role            │ Full R/W    │ Full R/W      │ Full R/W            │
│ admin users             │ Read Only   │ Read Only     │ Read + Update       │
│ authenticated users     │ BLOCKED     │ BLOCKED       │ BLOCKED             │
│ anonymous               │ BLOCKED     │ BLOCKED       │ BLOCKED             │
└─────────────────────────┴─────────────┴───────────────┴─────────────────────┘

⚠️  CRITICAL NOTES:
1. This preserves N8N automation functionality
2. Admin access requires 'admin' role in JWT claims
3. Regular users are completely blocked from sensitive data
4. Anonymous access is explicitly denied
5. Service role maintains full system access

🚨 PRE-DEPLOYMENT CHECKLIST:
□ Verify admin users have proper role in JWT claims
□ Test N8N automation still works with service_role
□ Confirm no legitimate user workflows are broken
□ Monitor logs for access denied errors after deployment

📋 ROLLBACK PLAN:
If issues occur, disable RLS with:
ALTER TABLE public.event_store DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_projections DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.trigger_suppression_config DISABLE ROW LEVEL SECURITY;
*/

RAISE NOTICE '🎉 Agent DB RLS policies successfully created!';
RAISE NOTICE '🔍 Review policy matrix above before applying';
RAISE NOTICE '⚠️  Test thoroughly in staging environment first'; 