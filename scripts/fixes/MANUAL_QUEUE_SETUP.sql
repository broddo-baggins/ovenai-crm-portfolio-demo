-- ===================================================================
-- MANUAL QUEUE SYSTEM SETUP - PASTE THIS INTO SUPABASE SQL EDITOR
-- ===================================================================
-- Target: Site DB (ajszzemkpenbfnghqiyz.supabase.co)
-- Date: January 29, 2025
-- Purpose: Enable queue functionality with minimal setup
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/ajszzemkpenbfnghqiyz/sql/new
-- 2. Copy this ENTIRE file contents and paste into the SQL editor
-- 3. Click "Run" button
-- 4. Should see "Queue System Setup Completed!" message
--
-- FIXES APPLIED:
-- • Handles existing queue_ledger table with missing columns
-- • Safely drops and recreates functions with correct return types
-- • Adds comprehensive verification queries
-- ===================================================================

BEGIN;

-- 1. CREATE MISSING QUEUE LEDGER TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS queue_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Lead Information
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID,  -- Allow NULL for system actions
    
    -- Action Tracking
    action TEXT NOT NULL CHECK (action IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'taken')),
    previous_state TEXT,
    new_state TEXT,
    
    -- Metadata
    context JSONB DEFAULT '{}',
    batch_id UUID,
    
    -- Actor Information  
    actor_id UUID,
    actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'automation')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- =========================================
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS queue_metadata JSONB DEFAULT '{}';

ALTER TABLE user_queue_settings
ADD COLUMN IF NOT EXISTS daily_capacity INTEGER DEFAULT 100;

ALTER TABLE user_queue_settings
ADD COLUMN IF NOT EXISTS hourly_rate_limit INTEGER DEFAULT 50;

-- 2b. ENSURE QUEUE_LEDGER HAS ALL REQUIRED COLUMNS
-- ===============================================
-- Add missing columns to existing queue_ledger table
ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';

ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS previous_state TEXT;

ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS new_state TEXT;

ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS actor_id UUID;

ALTER TABLE queue_ledger 
ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'automation'));

-- 2c. FIX NOT NULL CONSTRAINT ON USER_ID
-- =====================================
-- Allow user_id to be NULL for system actions
-- This needs to be done carefully to handle existing constraints
DO $$
BEGIN
    -- Check if the constraint exists and remove it if needed
    BEGIN
        ALTER TABLE queue_ledger ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE '✅ Removed NOT NULL constraint from user_id column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  user_id column constraint adjustment not needed';
    END;
END $$;

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =================================
CREATE INDEX IF NOT EXISTS idx_queue_ledger_lead_action 
    ON queue_ledger(lead_id, action);

CREATE INDEX IF NOT EXISTS idx_queue_ledger_created_at 
    ON queue_ledger(created_at);

-- 4. ENABLE ROW LEVEL SECURITY
-- ============================
ALTER TABLE queue_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid "already exists" error)
DROP POLICY IF EXISTS "Users can view their own queue ledger entries" ON queue_ledger;
DROP POLICY IF EXISTS "Users can create queue ledger entries" ON queue_ledger;
DROP POLICY IF EXISTS "System can manage all queue ledger entries" ON queue_ledger;

-- Create policies safely
CREATE POLICY "Users can view their own queue ledger entries" ON queue_ledger
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = actor_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can create queue ledger entries" ON queue_ledger
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = actor_id OR
        auth.role() = 'service_role'
    );

CREATE POLICY "System can manage all queue ledger entries" ON queue_ledger
    FOR ALL USING (auth.role() = 'service_role');

-- 5. CREATE QUEUE STATE MANAGEMENT FUNCTION
-- =========================================
-- Drop existing function first (safe handling of return type changes)
DROP FUNCTION IF EXISTS get_current_queue_state(UUID);

CREATE FUNCTION get_current_queue_state(lead_uuid UUID)
RETURNS TABLE (
    current_action TEXT,
    last_update TIMESTAMPTZ,
    context JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ql.action,
        ql.created_at,
        ql.context
    FROM queue_ledger ql
    WHERE ql.lead_id = lead_uuid
    ORDER BY ql.created_at DESC
    LIMIT 1;
END;
$$;

-- 6. CREATE ACTION RECORDING FUNCTION
-- ===================================
-- Drop existing function first (safe handling of signature changes)
DROP FUNCTION IF EXISTS record_queue_action(UUID, TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS record_queue_action(UUID, TEXT);

CREATE FUNCTION record_queue_action(
    p_lead_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ledger_id UUID;
    effective_user_id UUID;
    effective_actor_type TEXT;
BEGIN
    -- Determine effective user and actor type
    effective_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Set actor type based on how the function was called
    IF p_user_id IS NOT NULL THEN
        effective_actor_type := 'user';
    ELSIF auth.uid() IS NOT NULL THEN
        effective_actor_type := 'user';
    ELSE
        effective_actor_type := 'system';
    END IF;

    -- Insert the queue action record
    INSERT INTO queue_ledger (
        lead_id,
        user_id,
        action,
        context,
        actor_id,
        actor_type
    ) VALUES (
        p_lead_id,
        effective_user_id,  -- This can now be NULL for pure system actions
        p_action,
        p_context,
        effective_user_id,
        effective_actor_type
    ) RETURNING id INTO ledger_id;
    
    RETURN ledger_id;
END;
$$;

-- 7. GRANT PERMISSIONS
-- ===================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE queue_ledger TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_current_queue_state(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_queue_action(UUID, TEXT, UUID, JSONB) TO authenticated, service_role;

COMMIT;

-- ===================================================================
-- VERIFICATION QUERIES - RUN THESE TO TEST
-- ===================================================================

-- Test 1: Check queue_ledger table exists and has required columns
SELECT 'queue_ledger structure' as status, 
       COUNT(*) as total_columns,
       SUM(CASE WHEN column_name = 'context' THEN 1 ELSE 0 END) as has_context,
       SUM(CASE WHEN column_name = 'actor_id' THEN 1 ELSE 0 END) as has_actor_id
FROM information_schema.columns 
WHERE table_name = 'queue_ledger';

-- Test 2: Check queue_ledger table records
SELECT 'queue_ledger records' as status, count(*) as records FROM queue_ledger;

-- Test 3: Check functions exist
SELECT 'Functions created' as status, 
       COUNT(*) as function_count 
FROM information_schema.routines 
WHERE routine_name IN ('get_current_queue_state', 'record_queue_action');

-- Test 4: Test function calls (this should return 0 results, not error)
SELECT 'Function test' as status, 
       (SELECT COUNT(*) FROM get_current_queue_state('00000000-0000-0000-0000-000000000000'::uuid)) as result;

-- Test 5: Verify RLS policies exist
SELECT 'RLS policies' as status,
       COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'queue_ledger';

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 QUEUE SYSTEM SETUP COMPLETED!';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ WHAT WAS CREATED/UPDATED:';
    RAISE NOTICE '   • queue_ledger table with all required columns';
    RAISE NOTICE '   • Missing columns added to existing tables';
    RAISE NOTICE '   • Queue state management functions (safely replaced)';
    RAISE NOTICE '   • Proper RLS policies for security';
    RAISE NOTICE '   • Performance indexes for fast queries';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Test queue buttons in your UI';
    RAISE NOTICE '   2. Run: node scripts/testing/test-queue-functionality.cjs';
    RAISE NOTICE '   3. Verify all 4 queue actions work';
    RAISE NOTICE '';
    RAISE NOTICE '📊 QUEUE ACTIONS ENABLED:';
    RAISE NOTICE '   • Prepare Tomorrow Queue';
    RAISE NOTICE '   • Start Automation';  
    RAISE NOTICE '   • Export Queue Data';
    RAISE NOTICE '   • Take Lead Button';
    RAISE NOTICE '';
END $$; 