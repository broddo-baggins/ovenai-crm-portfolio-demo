-- 🔧 MINIMAL QUEUE SCHEMA FIX - SAFE FOR AGENTDB
-- Updated to match ACTUAL database structure from MASTER_DB_ANALYSIS_2025-07-01.json
-- Uses IF NOT EXISTS to prevent conflicts with existing AgentDB schema
-- FIXED: Uses real database fields and string status values

-- ===============================================
-- 1. ADD MISSING FIELDS TO LEADS TABLE ONLY
-- ===============================================

-- Add processing_state if it doesn't exist (already exists in master DB)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS processing_state TEXT DEFAULT 'pending';

-- Add computed heat_score using ACTUAL database structure
-- Based on real status strings and interaction_count (which DOES exist)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS heat_score INTEGER GENERATED ALWAYS AS (
  CASE 
    -- Calculate heat score from ACTUAL string status values
    WHEN status IN ('unqualified', 'new') THEN 20
    WHEN status IN ('awareness', 'contacted') THEN 30
    WHEN status IN ('consideration', 'interested') THEN 50
    WHEN status IN ('interest', 'qualified') THEN 60
    WHEN status IN ('intent', 'evaluation') THEN 70
    WHEN status IN ('purchase_ready', 'converted') THEN 90
    ELSE 25  -- Default for any other status
  END + 
  -- Add interaction count bonus (field DOES exist in master DB)
  COALESCE(
    CASE 
      WHEN interaction_count > 10 THEN 20
      WHEN interaction_count > 5 THEN 15
      WHEN interaction_count > 0 THEN 10
      ELSE 0
    END, 0
  )
) STORED;

-- Add computed bant_score from existing bant_status (using ACTUAL values from master DB)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS bant_score INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN bant_status IN ('fully_qualified') THEN 10
    WHEN bant_status IN ('need_qualified', 'partially_qualified', 'budget_qualified', 'authority_qualified', 'timing_qualified') THEN 7
    WHEN bant_status IN ('no_bant') THEN 3
    ELSE 5
  END
) STORED;

-- Add queue_metadata if missing
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS queue_metadata JSONB DEFAULT '{}';

-- Add processing state constraint (using ACTUAL processing_state values from master DB)
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_processing_state_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_processing_state_check 
CHECK (processing_state IN ('pending', 'queued', 'active', 'completed', 'failed', 'archived', 'rate_limited'));

-- ===============================================
-- 2. CREATE LEAD_PROCESSING_QUEUE TABLE (MINIMAL)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.lead_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Relationships (must match existing leads.id format)
    lead_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Processing State
    processing_state TEXT NOT NULL DEFAULT 'pending' CHECK (processing_state IN (
        'pending', 'queued', 'active', 'completed', 'failed', 'archived'
    )),
    
    -- Priority & Scheduling
    priority INTEGER DEFAULT 5,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    -- Processing Lifecycle
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error Handling
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    queue_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 3. CREATE INDEXES ONLY FOR NEW TABLES
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_state 
    ON public.lead_processing_queue(processing_state);

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_lead_id 
    ON public.lead_processing_queue(lead_id);

-- ===============================================
-- 4. GRANT PERMISSIONS & RLS
-- ===============================================

GRANT ALL ON public.lead_processing_queue TO anon, authenticated, service_role;

-- Enable RLS  
ALTER TABLE public.lead_processing_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user access
CREATE POLICY "Users can manage their own queue entries" ON public.lead_processing_queue
    FOR ALL USING (auth.uid()::text = user_id::text);

-- ===============================================
-- 5. UPDATE EXISTING LEADS STATUS TO MATCH MASTER
-- ===============================================

-- Convert any integer status values to proper string values
UPDATE public.leads 
SET status = CASE 
  WHEN status = '1' THEN 'unqualified'
  WHEN status = '2' THEN 'awareness' 
  WHEN status = '3' THEN 'consideration'
  WHEN status = '4' THEN 'interest'
  WHEN status = '5' THEN 'intent'
  WHEN status = '6' THEN 'evaluation'
  WHEN status = '7' THEN 'purchase_ready'
  ELSE status  -- Keep existing string values
END
WHERE status ~ '^[0-9]+$';  -- Only update numeric status values

-- ===============================================
-- 6. VERIFICATION
-- ===============================================

-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' 
    AND column_name IN ('processing_state', 'heat_score', 'bant_score', 'queue_metadata')
    AND table_schema = 'public';

-- Verify new table exists
SELECT COUNT(*) as record_count FROM public.lead_processing_queue; 