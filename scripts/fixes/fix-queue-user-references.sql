-- 🔧 QUEUE USER REFERENCES FIX
--
-- Fix the issue where whatsapp_message_queue.user_id references auth.users
-- but we're using client_id values that exist in the clients table instead
--
-- Options:
-- 1. Change FK to reference clients table instead of auth.users
-- 2. Create proper user records in auth.users
-- 3. Use a different approach for user referencing
--
-- Target: Site DB (ajszzemkpenbfnghqiyz.supabase.co)
-- =================================================================

BEGIN;

-- Check what's in auth.users vs clients
SELECT 'auth.users count:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'clients count:' as info, COUNT(*) as count FROM clients;

-- Option 1: Update FK constraints to reference clients table instead
-- This makes more sense since we're using client_id values

-- Drop existing FK constraints that reference auth.users
ALTER TABLE whatsapp_message_queue DROP CONSTRAINT IF EXISTS whatsapp_message_queue_user_id_fkey;
ALTER TABLE lead_processing_queue DROP CONSTRAINT IF EXISTS lead_processing_queue_user_id_fkey;
ALTER TABLE queue_performance_metrics DROP CONSTRAINT IF EXISTS queue_performance_metrics_user_id_fkey;
ALTER TABLE user_queue_settings DROP CONSTRAINT IF EXISTS user_queue_settings_user_id_fkey;

-- Add new FK constraints that reference clients table
ALTER TABLE whatsapp_message_queue 
ADD CONSTRAINT whatsapp_message_queue_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE lead_processing_queue 
ADD CONSTRAINT lead_processing_queue_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE queue_performance_metrics 
ADD CONSTRAINT queue_performance_metrics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE user_queue_settings 
ADD CONSTRAINT user_queue_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Update queue_ledger FK as well
ALTER TABLE queue_ledger DROP CONSTRAINT IF EXISTS queue_ledger_user_id_fkey;
ALTER TABLE queue_ledger 
ADD CONSTRAINT queue_ledger_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Also update actor_id FK in queue_ledger 
ALTER TABLE queue_ledger DROP CONSTRAINT IF EXISTS queue_ledger_actor_id_fkey;
ALTER TABLE queue_ledger 
ADD CONSTRAINT queue_ledger_actor_id_fkey 
FOREIGN KEY (actor_id) REFERENCES clients(id) ON DELETE SET NULL;

COMMIT;

-- =================================================================
-- VALIDATION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ QUEUE USER REFERENCES FIXED';
    RAISE NOTICE '=================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 CHANGES MADE:';
    RAISE NOTICE '  • All user_id foreign keys now reference clients table';
    RAISE NOTICE '  • This matches the actual data structure where client_id is used';
    RAISE NOTICE '  • Queue operations should now work with existing client data';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '  1. Re-run queue functionality tests';
    RAISE NOTICE '  2. Verify all four UI buttons work correctly';
    RAISE NOTICE '  3. Test with actual application UI';
    RAISE NOTICE '';
END $$; 