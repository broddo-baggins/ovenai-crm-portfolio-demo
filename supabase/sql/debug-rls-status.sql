-- =============================================
-- DEBUG RLS STATUS
-- =============================================
-- This script helps debug why RLS is blocking operations

BEGIN;

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('clients', 'projects', 'leads', 'conversations', 'client_members', 'project_members', 'lead_members', 'conversation_members')
ORDER BY tablename;

-- Check what RLS policies exist
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
ORDER BY tablename, policyname;

-- Check if membership tables exist
SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
    ('client_members'),
    ('project_members'), 
    ('lead_members'),
    ('conversation_members')
) AS t(table_name);

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    CASE WHEN trigger_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('clients', 'projects', 'leads', 'conversations')
    AND trigger_name LIKE '%membership%'
ORDER BY event_object_table, trigger_name;

-- Check current auth context (this will be NULL in SQL editor, but shows the function exists)
SELECT 
    'Current auth context' as test_type,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NO AUTH CONTEXT'
        ELSE '✅ AUTH CONTEXT FOUND'
    END as auth_status;

-- Test a simple INSERT policy check (this will fail but shows the error)
-- We'll try to create a test record without proper auth context
DO $$
BEGIN
    -- This should fail with RLS error, which is what we expect
    BEGIN
        INSERT INTO public.clients (name, contact_info) 
        VALUES ('Test RLS Client', '{"email": "test@rls.com"}');
        
        RAISE NOTICE '❌ UNEXPECTED: Insert succeeded without auth context';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ EXPECTED: RLS correctly blocked insert without auth context';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  OTHER ERROR: %', SQLERRM;
    END;
END $$;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%membership%'
ORDER BY routine_name;

-- Show sample data from membership tables (if any exists)
DO $$
DECLARE
    rec RECORD;
    count_val INTEGER;
BEGIN
    FOR rec IN SELECT table_name FROM (VALUES 
        ('client_members'),
        ('project_members'), 
        ('lead_members'),
        ('conversation_members')
    ) AS t(table_name)
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM public.%I', rec.table_name) INTO count_val;
            RAISE NOTICE 'Table % has % records', rec.table_name, count_val;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Table % error: %', rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;

-- Final summary
SELECT 
    'RLS Debug Complete' as status,
    NOW() as timestamp; 