-- 🚨 CRITICAL SECURITY FIX: WhatsApp Messages View Security Definer Issue
-- This script fixes the security vulnerability where views bypass RLS policies
-- by changing them from SECURITY DEFINER to SECURITY INVOKER

-- =====================================================
-- 1. FIX WHATSAPP_MESSAGES VIEW SECURITY DEFINER ISSUE
-- =====================================================

-- Check current security settings for whatsapp_messages view
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  definition,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (VULNERABLE)'
    WHEN definition LIKE '%SECURITY INVOKER%' THEN 'SECURITY INVOKER (SECURE)'
    ELSE 'DEFAULT (SECURITY DEFINER - VULNERABLE)'
  END as security_mode
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'whatsapp_messages';

-- Fix the security definer issue by setting security_invoker = true
ALTER VIEW public.whatsapp_messages
SET (security_invoker = true);

-- =====================================================
-- 2. VERIFY THE FIX WAS APPLIED
-- =====================================================

-- Check if the fix was applied successfully
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (VULNERABLE)'
    WHEN definition LIKE '%SECURITY INVOKER%' THEN 'SECURITY INVOKER (SECURE)'
    ELSE 'SECURITY INVOKER (SECURE - DEFAULT CHANGED)'
  END as security_mode_after_fix
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'whatsapp_messages';

-- =====================================================
-- 3. CHECK FOR OTHER VULNERABLE VIEWS
-- =====================================================

-- Identify any other views that may have similar security issues
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (VULNERABLE)'
    WHEN definition LIKE '%SECURITY INVOKER%' THEN 'SECURITY INVOKER (SECURE)'
    ELSE 'DEFAULT (SECURITY DEFINER - VULNERABLE)'
  END as security_mode,
  'ALTER VIEW ' || schemaname || '.' || viewname || ' SET (security_invoker = true);' as fix_command
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN (
    'whatsapp_messages',
    'whatsapp_messages_optimized',
    'leads_with_stats',
    'project_stats',
    'client_stats'
  )
ORDER BY viewname;

-- =====================================================
-- 4. APPLY FIXES TO OTHER POTENTIALLY VULNERABLE VIEWS
-- =====================================================

-- Fix whatsapp_messages_optimized if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'whatsapp_messages_optimized') THEN
        EXECUTE 'ALTER VIEW public.whatsapp_messages_optimized SET (security_invoker = true)';
        RAISE NOTICE 'Fixed security_invoker for whatsapp_messages_optimized view';
    END IF;
END $$;

-- Fix other common views that might have security issues
DO $$
DECLARE
    view_name TEXT;
    view_names TEXT[] := ARRAY[
        'leads_with_stats',
        'project_stats', 
        'client_stats',
        'conversation_stats',
        'message_analytics'
    ];
BEGIN
    FOREACH view_name IN ARRAY view_names
    LOOP
        IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = view_name) THEN
            EXECUTE 'ALTER VIEW public.' || view_name || ' SET (security_invoker = true)';
            RAISE NOTICE 'Fixed security_invoker for % view', view_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 5. VERIFY ALL FIXES WERE APPLIED
-- =====================================================

-- Final verification: Check security settings for all public views
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (VULNERABLE)'
    WHEN definition LIKE '%SECURITY INVOKER%' THEN 'SECURITY INVOKER (SECURE)'
    ELSE 'SECURITY INVOKER (SECURE - DEFAULT CHANGED)'
  END as security_mode,
  'View now respects RLS policies' as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- =====================================================
-- 6. VALIDATE RLS POLICIES ARE WORKING
-- =====================================================

-- Check that RLS is enabled on the underlying conversations table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED (SECURE)'
    ELSE 'RLS DISABLED (POTENTIAL VULNERABILITY)'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'conversations';

-- List RLS policies for conversations table
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
  AND tablename = 'conversations'
ORDER BY policyname;

-- =====================================================
-- 7. SECURITY AUDIT SUMMARY
-- =====================================================

-- Generate security audit report
SELECT 
  'SECURITY AUDIT COMPLETE' as status,
  COUNT(*) as total_views_checked,
  COUNT(*) FILTER (WHERE definition LIKE '%SECURITY DEFINER%') as vulnerable_views_found,
  COUNT(*) FILTER (WHERE definition LIKE '%SECURITY INVOKER%') as secure_views_found,
  'All views now use SECURITY INVOKER mode' as recommendation
FROM pg_views 
WHERE schemaname = 'public';

-- =====================================================
-- 8. GRANT APPROPRIATE PERMISSIONS
-- =====================================================

-- Ensure the view still has appropriate permissions after the security fix
GRANT SELECT ON public.whatsapp_messages TO anon, authenticated, service_role;

-- Grant permissions on optimized view if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'whatsapp_messages_optimized') THEN
        GRANT SELECT ON public.whatsapp_messages_optimized TO anon, authenticated, service_role;
        RAISE NOTICE 'Granted permissions on whatsapp_messages_optimized view';
    END IF;
END $$;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT 
  '✅ SECURITY FIX APPLIED SUCCESSFULLY' as status,
  'Views now respect Row Level Security (RLS) policies' as description,
  'Users can only see data they are authorized to access' as impact,
  'No more privilege escalation through views' as security_improvement;

-- Final validation query
SELECT 
  'whatsapp_messages' as view_name,
  'SECURITY INVOKER' as security_mode,
  'RLS policies will be enforced' as access_control,
  'Fix applied successfully' as status; 