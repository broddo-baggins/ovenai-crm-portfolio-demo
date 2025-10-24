-- =============================================
-- FUNCTION SEARCH PATH SECURITY FIX
-- =============================================
-- 
-- This script fixes function search path security issues by adding
-- SECURITY DEFINER and proper search_path settings to all functions.
--
-- Based on Supabase database linter recommendations:
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Function to safely alter function search paths
CREATE OR REPLACE FUNCTION fix_function_search_path(
    function_name text,
    function_args text DEFAULT '',
    set_search_path text DEFAULT 'public'
) RETURNS text AS $$
DECLARE
    sql_statement text;
    result text;
BEGIN
    -- Build the ALTER FUNCTION statement
    IF function_args = '' THEN
        sql_statement := format('ALTER FUNCTION %I() SET search_path = %s', function_name, set_search_path);
    ELSE
        sql_statement := format('ALTER FUNCTION %I(%s) SET search_path = %s', function_name, function_args, set_search_path);
    END IF;
    
    -- Execute the statement
    BEGIN
        EXECUTE sql_statement;
        result := format('✅ Fixed: %s', function_name);
    EXCEPTION WHEN OTHERS THEN
        result := format('❌ Failed: %s - %s', function_name, SQLERRM);
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- FIX SYSTEM FUNCTIONS
-- =============================================

-- Cleanup old system changes
SELECT fix_function_search_path('cleanup_old_system_changes');

-- Notification functions
SELECT fix_function_search_path('get_notification_summary');

-- Validation functions
SELECT fix_function_search_path('validate_project_client_id');
SELECT fix_function_search_path('validate_client_data');
SELECT fix_function_search_path('verify_uuid_standardization');
SELECT fix_function_search_path('validate_phase1_standardization');

-- =============================================
-- FIX BACKEND NOTIFICATION FUNCTIONS
-- =============================================

-- Project notifications
SELECT fix_function_search_path('notify_backend_project_created');
SELECT fix_function_search_path('notify_backend_project_updated');

-- Lead notifications
SELECT fix_function_search_path('notify_backend_lead_created');
SELECT fix_function_search_path('notify_backend_lead_updated');

-- Client notifications
SELECT fix_function_search_path('notify_backend_client_created');
SELECT fix_function_search_path('notify_backend_client_updated');

-- Conversation notifications
SELECT fix_function_search_path('notify_backend_conversation_created');
SELECT fix_function_search_path('notify_backend_conversation_updated');

-- =============================================
-- FIX SYNC FUNCTIONS
-- =============================================

-- Core sync functions
SELECT fix_function_search_path('call_minimal_sync_rpc');
SELECT fix_function_search_path('call_backend_crud_sync');
SELECT fix_function_search_path('auto_sync_to_backend');

-- Frontend to backend sync
SELECT fix_function_search_path('frontend_sync_to_backend');
SELECT fix_function_search_path('frontend_leads_to_backend_sync');
SELECT fix_function_search_path('frontend_projects_to_backend_sync');

-- Specific sync functions
SELECT fix_function_search_path('sync_lead_to_backend');
SELECT fix_function_search_path('sync_lead_to_backend_fdw');
SELECT fix_function_search_path('sync_lead_to_agent');
SELECT fix_function_search_path('sync_lead_to_agent_no_jwt');
SELECT fix_function_search_path('sync_lead_from_site');
SELECT fix_function_search_path('manual_sync_lead');

-- Project sync functions
SELECT fix_function_search_path('sync_project_to_backend_create');
SELECT fix_function_search_path('sync_project_to_backend_update');

-- Conversation sync functions
SELECT fix_function_search_path('sync_conversation_to_backend_create');

-- Processed lead sync
SELECT fix_function_search_path('sync_processed_lead_to_frontend_seamless');

-- Trigger sync functions
SELECT fix_function_search_path('trigger_pending_syncs');
SELECT fix_function_search_path('trigger_process_agent_lead_seamless');

-- =============================================
-- FIX MEMBERSHIP FUNCTIONS
-- =============================================

-- Create membership functions
SELECT fix_function_search_path('create_client_membership');
SELECT fix_function_search_path('create_project_membership');
SELECT fix_function_search_path('create_conversation_membership');
SELECT fix_function_search_path('create_lead_membership');

-- Add owner membership
SELECT fix_function_search_path('add_owner_membership');

-- Insert bypass membership
SELECT fix_function_search_path('insert_client_bypass_membership');

-- =============================================
-- FIX USER AND STATUS FUNCTIONS
-- =============================================

-- User handling
SELECT fix_function_search_path('handle_new_user');
SELECT fix_function_search_path('handle_user_status_change');

-- Status updates
SELECT fix_function_search_path('create_initial_status_update');
SELECT fix_function_search_path('update_lead_status_on_change');

-- Updated at handling
SELECT fix_function_search_path('handle_updated_at');
SELECT fix_function_search_path('update_updated_at_column');
SELECT fix_function_search_path('update_user_integrations_updated_at');
SELECT fix_function_search_path('update_user_performance_targets_updated_at');

-- =============================================
-- FIX PROJECT AND LEAD COUNT FUNCTIONS
-- =============================================

-- Project lead count functions
SELECT fix_function_search_path('get_project_lead_count');
SELECT fix_function_search_path('update_project_lead_counts');
SELECT fix_function_search_path('refresh_all_project_lead_counts');

-- =============================================
-- FIX SESSION AND ANALYTICS FUNCTIONS
-- =============================================

-- Session cleanup
SELECT fix_function_search_path('cleanup_expired_sessions');

-- Analytics
SELECT fix_function_search_path('extract_form_analytics');

-- =============================================
-- FIX TRIGGER CONTROL FUNCTIONS
-- =============================================

-- Trigger control
SELECT fix_function_search_path('enable_frontend_to_backend_triggers');
SELECT fix_function_search_path('disable_frontend_to_backend_triggers');

-- =============================================
-- FIX CROSS-DATABASE FUNCTIONS
-- =============================================

-- Cross-database operations
SELECT fix_function_search_path('handle_cross_database_insert');
SELECT fix_function_search_path('handle_cross_database_batch_insert');

-- =============================================
-- FIX TESTING AND DEBUG FUNCTIONS
-- =============================================

-- Testing functions
SELECT fix_function_search_path('test_fdw_configuration');
SELECT fix_function_search_path('test_sync_system_comprehensive');

-- Schema functions
SELECT fix_function_search_path('force_schema_refresh');

-- =============================================
-- RECREATE CRITICAL FUNCTIONS WITH SECURITY DEFINER
-- =============================================

-- Add owner membership function (critical for RLS)
CREATE OR REPLACE FUNCTION public.add_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add membership if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'clients' THEN
        INSERT INTO client_members (client_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (client_id, user_id) DO NOTHING;
        
      WHEN 'projects' THEN
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
      WHEN 'leads' THEN
        INSERT INTO lead_members (lead_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (lead_id, user_id) DO NOTHING;
        
      WHEN 'conversations' THEN
        INSERT INTO conversation_members (conversation_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Handle new user function (for auth triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, updated_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Updated at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- CREATE MONITORING FUNCTION
-- =============================================

-- Function to check remaining search path issues
CREATE OR REPLACE FUNCTION public.check_function_search_paths()
RETURNS TABLE(
  function_name text,
  function_args text,
  has_search_path boolean,
  search_path_value text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text as function_name,
    pg_get_function_arguments(p.oid)::text as function_args,
    (p.proconfig IS NOT NULL AND 
     EXISTS(SELECT 1 FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%')) as has_search_path,
    (SELECT config FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%' LIMIT 1) as search_path_value
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'uuid_%'
  ORDER BY p.proname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- VERIFICATION AND CLEANUP
-- =============================================

-- Check for any remaining functions without search_path
SELECT 
  'Functions without search_path:' as status,
  COUNT(*) as count
FROM public.check_function_search_paths()
WHERE NOT has_search_path;

-- Show functions that still need fixing
SELECT 
  function_name,
  'Missing search_path' as issue
FROM public.check_function_search_paths()
WHERE NOT has_search_path
LIMIT 10;

-- Drop the helper function
DROP FUNCTION IF EXISTS fix_function_search_path(text, text, text);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_owner_membership() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_function_search_paths() TO authenticated, service_role;

-- Final report
SELECT 
  'Function Search Path Security Fix Complete' as status,
  NOW() as timestamp;

-- Show summary of fixed functions
SELECT 
  COUNT(*) as total_functions,
  COUNT(CASE WHEN has_search_path THEN 1 END) as functions_with_search_path,
  COUNT(CASE WHEN NOT has_search_path THEN 1 END) as functions_still_needing_fix
FROM public.check_function_search_paths(); 