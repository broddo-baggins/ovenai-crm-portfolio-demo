-- 🚨 EMERGENCY ROLLBACK SCRIPT - Agent DB RLS
-- Target: Agent DB (imnyrhjdoaccxenxyfam.supabase.co)
-- 
-- ⚠️  USE ONLY IN EMERGENCY if RLS policies break N8N automation
-- This script completely disables RLS and removes all policies

-- =====================================================
-- EMERGENCY RLS DISABLE
-- =====================================================

-- Disable RLS immediately (restores original unrestricted access)
ALTER TABLE public.event_store DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_projections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_suppression_config DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVE ALL POLICIES (OPTIONAL - for clean slate)
-- =====================================================

-- Drop event_store policies
DROP POLICY IF EXISTS "service_role_full_access_event_store" ON public.event_store;
DROP POLICY IF EXISTS "admin_read_event_store" ON public.event_store;
DROP POLICY IF EXISTS "block_user_access_event_store" ON public.event_store;
DROP POLICY IF EXISTS "deny_anon_access_event_store" ON public.event_store;

-- Drop event_projections policies  
DROP POLICY IF EXISTS "service_role_full_access_event_projections" ON public.event_projections;
DROP POLICY IF EXISTS "admin_read_event_projections" ON public.event_projections;
DROP POLICY IF EXISTS "block_user_access_event_projections" ON public.event_projections;
DROP POLICY IF EXISTS "deny_anon_access_event_projections" ON public.event_projections;

-- Drop trigger_suppression_config policies
DROP POLICY IF EXISTS "service_role_full_access_trigger_suppression" ON public.trigger_suppression_config;
DROP POLICY IF EXISTS "admin_read_trigger_suppression" ON public.trigger_suppression_config;
DROP POLICY IF EXISTS "admin_update_trigger_suppression" ON public.trigger_suppression_config;
DROP POLICY IF EXISTS "block_user_access_trigger_suppression" ON public.trigger_suppression_config;
DROP POLICY IF EXISTS "deny_anon_access_trigger_suppression" ON public.trigger_suppression_config;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Still Enabled'
        ELSE '✅ RLS Disabled (Unrestricted Access)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config');

-- Check remaining policies
SELECT 
    tablename,
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
GROUP BY tablename;

-- =====================================================
-- EMERGENCY STATUS REPORT
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 EMERGENCY ROLLBACK COMPLETED';
    RAISE NOTICE '==============================';
    RAISE NOTICE '✅ RLS disabled on all 3 tables';
    RAISE NOTICE '✅ All security policies removed';
    RAISE NOTICE '✅ N8N automation should now work normally';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY WARNING:';
    RAISE NOTICE '   Tables are now UNPROTECTED and accessible to all users';
    RAISE NOTICE '   This is a temporary emergency state';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Verify N8N automation is working';
    RAISE NOTICE '2. Investigate why RLS policies failed';
    RAISE NOTICE '3. Review and fix the RLS implementation';
    RAISE NOTICE '4. Re-apply security policies when ready';
END $$; 