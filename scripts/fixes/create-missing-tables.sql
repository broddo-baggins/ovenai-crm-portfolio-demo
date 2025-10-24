-- =====================================================
-- CREATE MISSING TABLES FOR TYPESCRIPT FIX
-- =====================================================
-- 
-- This SQL creates the missing tables that are causing 273 TypeScript errors:
-- - conversation_audit_log
-- - dashboard_system_metrics
-- 
-- These tables are referenced in the code but missing from Site DB types.
-- 
-- Instructions:
-- 1. Copy this SQL 
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run this SQL
-- 4. After running, regenerate TypeScript types
-- =====================================================

-- =====================================================
-- 1. CONVERSATION AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  validation_mode TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_conversation_id 
  ON conversation_audit_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_created_at 
  ON conversation_audit_log(created_at);

-- Enable RLS
ALTER TABLE conversation_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" ON conversation_audit_log
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. DASHBOARD SYSTEM METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_queue_items_24h INTEGER DEFAULT 0,
  processed_messages INTEGER DEFAULT 0,
  queued_messages INTEGER DEFAULT 0,
  failed_messages INTEGER DEFAULT 0,
  processing_messages INTEGER DEFAULT 0,
  avg_processing_time_seconds TEXT,
  avg_queue_wait_time_seconds TEXT,
  max_retry_count INTEGER DEFAULT 0,
  avg_queue_priority INTEGER DEFAULT 0,
  success_rate_percentage TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_system_metrics_created_at 
  ON dashboard_system_metrics(created_at);

-- Enable RLS
ALTER TABLE dashboard_system_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" ON dashboard_system_metrics
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. VERIFY TABLES WERE CREATED
-- =====================================================
-- Run this to confirm tables exist:
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('conversation_audit_log', 'dashboard_system_metrics')
-- ORDER BY table_name;

-- =====================================================
-- NEXT STEPS AFTER RUNNING THIS SQL:
-- =====================================================
-- 1. Run: supabase gen types typescript --project-id ajszzemkpenbfnghqiyz > src/types/database.ts
-- 2. Fix environment variable naming issues
-- 3. Fix field mismatches in conversations table
-- 4. Remove @ts-nocheck comments from fixed files
-- 5. Re-enable TypeScript checking in pre-push hooks
-- ===================================================== 