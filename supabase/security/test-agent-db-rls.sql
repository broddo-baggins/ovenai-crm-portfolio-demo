-- 🧪 AGENT DB RLS TESTING SCRIPT
-- Target: Agent DB (imnyrhjdoaccxenxyfam.supabase.co)
-- 
-- ⚠️  SAFE TESTING ONLY - This script only CHECKS current state
-- Run this FIRST to understand current security status

-- =====================================================
-- 1. CURRENT RLS STATUS CHECK
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
ORDER BY tablename;

-- =====================================================
-- 2. EXISTING POLICIES CHECK
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No restrictions'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No check'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. TABLE STRUCTURE ANALYSIS
-- =====================================================

-- Check table schemas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name ILIKE '%user%' THEN '👤 User-related'
        WHEN column_name ILIKE '%created_by%' THEN '👤 Creator field'
        WHEN column_name ILIKE '%owner%' THEN '👤 Owner field'
        WHEN column_name ILIKE '%admin%' THEN '🔑 Admin field'
        ELSE '📄 General field'
    END as field_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('event_store', 'event_projections', 'trigger_suppression_config')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 4. RECORD COUNT ANALYSIS
-- =====================================================

-- Get table sizes (safe read-only query)
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN n_tup_ins > 0 THEN CONCAT(n_tup_ins, ' records inserted')
        ELSE 'Empty table'
    END as record_status,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND relname IN ('event_store', 'event_projections', 'trigger_suppression_config');

-- =====================================================
-- 5. SECURITY RECOMMENDATIONS
-- =====================================================

DO $$
DECLARE
    rec RECORD;
    table_count INTEGER := 0;
    rls_enabled_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 AGENT DB SECURITY ANALYSIS REPORT';
    RAISE NOTICE '=====================================';
    
    -- Count tables and RLS status
    FOR rec IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('event_store', 'event_projections', 'trigger_suppression_config')
    LOOP
        table_count := table_count + 1;
        IF rec.rowsecurity THEN
            rls_enabled_count := rls_enabled_count + 1;
            RAISE NOTICE '✅ %: RLS Enabled', rec.tablename;
        ELSE
            RAISE NOTICE '❌ %: RLS Disabled (SECURITY RISK)', rec.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 SUMMARY:';
    RAISE NOTICE '  Tables checked: %', table_count;
    RAISE NOTICE '  RLS enabled: %', rls_enabled_count;
    RAISE NOTICE '  Security gaps: %', (table_count - rls_enabled_count);
    
    IF rls_enabled_count = table_count THEN
        RAISE NOTICE '🎉 All tables are secured with RLS';
    ELSE
        RAISE NOTICE '🚨 SECURITY ALERT: % tables need RLS policies', (table_count - rls_enabled_count);
        RAISE NOTICE '';
        RAISE NOTICE '💡 NEXT STEPS:';
        RAISE NOTICE '1. Review the agent-db-rls-fix.sql script';
        RAISE NOTICE '2. Test in a staging environment first';
        RAISE NOTICE '3. Apply policies during maintenance window';
        RAISE NOTICE '4. Monitor N8N automation after changes';
    END IF;
END $$;

-- =====================================================
-- 6. SAFE POLICY PREVIEW (NO CHANGES MADE)
-- =====================================================

RAISE NOTICE '';
RAISE NOTICE '🎯 PROPOSED SECURITY MODEL:';
RAISE NOTICE '===========================';
RAISE NOTICE 'event_store: Service role = Full Access, Admin = Read, Users = Blocked';
RAISE NOTICE 'event_projections: Service role = Full Access, Admin = Read, Users = Blocked';  
RAISE NOTICE 'trigger_suppression_config: Service role = Full Access, Admin = Read/Update, Users = Blocked';
RAISE NOTICE '';
RAISE NOTICE '⚠️  This script made NO CHANGES - it only analyzed current state';
RAISE NOTICE '📋 Ready to proceed with agent-db-rls-fix.sql when you approve'; 