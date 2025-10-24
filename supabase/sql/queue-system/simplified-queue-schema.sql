-- 🚀 SIMPLIFIED QUEUE SYSTEM SCHEMA
-- Target: Site DB (ajszzemkpenbfnghqiyz.supabase.co)
-- 
-- CONSOLIDATES multiple queue tables into ONE primary system
-- Designed for AgentDB integration with comprehensive error handling
-- ===============================================================

-- ===============================================
-- 1. PRIMARY QUEUE TABLE (CONSOLIDATED)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.lead_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Relationships
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Processing State (SIMPLIFIED)
    processing_state TEXT NOT NULL DEFAULT 'pending' CHECK (processing_state IN (
        'pending',      -- Ready for queue
        'queued',       -- In processing queue  
        'active',       -- Being processed by AgentDB
        'completed',    -- Successfully processed
        'failed',       -- Processing failed
        'archived'      -- Long-term storage
    )),
    
    -- Priority & Scheduling
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    queue_position INTEGER,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    -- Processing Lifecycle
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error Handling & Retry Logic
    attempts INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    error_code TEXT,
    last_retry_at TIMESTAMPTZ,
    
    -- AgentDB Integration
    agent_trigger_id TEXT,
    agent_conversation_id TEXT,
    webhook_payload JSONB,
    webhook_response JSONB,
    webhook_status TEXT CHECK (webhook_status IN ('pending', 'sent', 'success', 'failed')),
    
    -- Performance Tracking
    estimated_duration_seconds INTEGER,
    actual_duration_seconds INTEGER,
    processing_step TEXT,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Metadata & Configuration
    queue_metadata JSONB DEFAULT '{}',
    processing_config JSONB DEFAULT '{}',
    business_rules JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 2. USER QUEUE SETTINGS (SIMPLIFIED)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.user_queue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Hours & Work Days (JSONB for flexibility)
    work_days JSONB DEFAULT '{
        "enabled": true,
        "work_days": [1, 2, 3, 4, 5],
        "business_hours": {
            "start": "09:00",
            "end": "17:00", 
            "timezone": "Asia/Jerusalem"
        },
        "exclude_holidays": true,
        "custom_holidays": ["2025-01-01", "2025-12-25"]
    }',
    
    -- Processing Targets & Capacity
    processing_targets JSONB DEFAULT '{
        "target_leads_per_month": 1000,
        "target_leads_per_work_day": 45,
        "max_daily_capacity": 200,
        "weekend_processing": {
            "enabled": false,
            "reduced_target_percentage": 25
        }
    }',
    
    -- Automation Settings
    automation JSONB DEFAULT '{
        "auto_queue_preparation": true,
        "queue_preparation_time": "18:00",
        "auto_start_processing": false,
        "pause_on_weekends": true,
        "pause_on_holidays": true,
        "max_retry_attempts": 3,
        "retry_delay_minutes": 15
    }',
    
    -- Advanced Configuration
    advanced JSONB DEFAULT '{
        "priority_scoring": {
            "enabled": true,
            "factors": ["heat_score", "bant_score", "days_since_contact"],
            "weights": {"heat_score": 0.4, "bant_score": 0.4, "days_since_contact": 0.2}
        },
        "batch_processing": {
            "enabled": true,
            "batch_size": 50,
            "batch_delay_seconds": 30
        },
        "rate_limiting": {
            "messages_per_hour": 1000,
            "messages_per_day": 10000,
            "respect_business_hours": true
        },
        "error_handling": {
            "max_consecutive_failures": 5,
            "failure_cooldown_minutes": 30,
            "auto_escalation": true
        }
    }',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- ===============================================
-- 3. OPTIONAL: WHATSAPP MESSAGE QUEUE (SIMPLIFIED)
-- ===============================================
-- Keep this for WhatsApp-specific messaging if needed

CREATE TABLE IF NOT EXISTS public.whatsapp_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    lead_processing_queue_id UUID REFERENCES public.lead_processing_queue(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message Content
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'media', 'interactive')),
    message_content TEXT NOT NULL,
    template_name TEXT,
    template_parameters JSONB DEFAULT '{}',
    
    -- WhatsApp Specific
    recipient_phone TEXT NOT NULL,
    sender_phone_number_id TEXT,
    whatsapp_message_id TEXT,
    
    -- Processing Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sending', 'sent', 'failed', 'cancelled')),
    
    -- Error Handling
    attempts INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    
    -- Timestamps
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 4. PERFORMANCE INDEXES
-- ===============================================

-- Primary queue indexes
CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_state 
    ON public.lead_processing_queue(processing_state);

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_priority 
    ON public.lead_processing_queue(priority DESC, queue_position ASC);

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_scheduled 
    ON public.lead_processing_queue(scheduled_for) 
    WHERE processing_state IN ('pending', 'queued');

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_user 
    ON public.lead_processing_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_processing_queue_lead 
    ON public.lead_processing_queue(lead_id);

-- WhatsApp queue indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status 
    ON public.whatsapp_message_queue(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_scheduled 
    ON public.whatsapp_message_queue(scheduled_for) 
    WHERE status = 'pending';

-- ===============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS
ALTER TABLE public.lead_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

-- Lead processing queue policies
CREATE POLICY "Users can view their own queue items" ON public.lead_processing_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own queue items" ON public.lead_processing_queue
    FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON public.user_queue_settings
    FOR ALL USING (auth.uid() = user_id);

-- WhatsApp queue policies
CREATE POLICY "Users can manage their own messages" ON public.whatsapp_message_queue
    FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- 6. TRIGGERS & FUNCTIONS
-- ===============================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all queue tables
CREATE TRIGGER update_lead_processing_queue_updated_at 
    BEFORE UPDATE ON public.lead_processing_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_queue_settings_updated_at 
    BEFORE UPDATE ON public.user_queue_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_queue_updated_at 
    BEFORE UPDATE ON public.whatsapp_message_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 7. SAMPLE DATA INITIALIZATION
-- ===============================================

-- Insert default queue settings for existing users
INSERT INTO public.user_queue_settings (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_queue_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ===============================================
-- SUMMARY
-- ===============================================
-- 
-- ✅ CONSOLIDATED ARCHITECTURE:
-- 1. lead_processing_queue - PRIMARY table for all queue operations
-- 2. user_queue_settings - User-specific configuration (JSONB flexible)
-- 3. whatsapp_message_queue - Optional WhatsApp-specific messaging
-- 
-- ✅ KEY FEATURES:
-- - Comprehensive error handling with retry logic
-- - AgentDB webhook integration fields
-- - Business rules and performance tracking
-- - Flexible JSONB configuration
-- - RLS security policies
-- - Auto-updating timestamps
-- 
-- ✅ ELIMINATED:
-- - background_jobs table (not needed)
-- - queue_performance_metrics table (data can be calculated)
-- - Multiple separate queue tables (consolidated)
-- 
-- 🎯 RESULT: Clean, efficient, AgentDB-ready queue system! 