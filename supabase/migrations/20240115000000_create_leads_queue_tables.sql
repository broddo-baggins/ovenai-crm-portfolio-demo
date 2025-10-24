-- Leads Queue Database Schema Migration
-- Creates tables for WhatsApp message queue management, user settings, and performance tracking
-- UPDATED: Works with existing database structure (clients table already exists)

BEGIN;

-- Check if required tables exist, if not skip migration
DO $$
BEGIN
    -- Verify that required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'leads table does not exist. Run core schema migrations first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'clients table does not exist. Run core schema migrations first.';
    END IF;
    
    RAISE NOTICE 'Core tables verified. Proceeding with queue system migration...';
END $$;

-- 1. Update existing WhatsApp Message Queue Table or create if not exists
DO $$
BEGIN
    -- Check if whatsapp_message_queue table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_message_queue' AND table_schema = 'public') THEN
        RAISE NOTICE 'whatsapp_message_queue table exists, updating structure...';
        
        -- Add client_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'client_id') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added client_id column to whatsapp_message_queue';
        END IF;
        
        -- Add missing columns for our queue system if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'message_template') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN message_template TEXT;
            RAISE NOTICE 'Added message_template column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'message_variables') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN message_variables JSONB DEFAULT '{}';
            RAISE NOTICE 'Added message_variables column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'attempts') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN attempts INTEGER DEFAULT 0;
            RAISE NOTICE 'Added attempts column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'last_error') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN last_error TEXT;
            RAISE NOTICE 'Added last_error column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'error_code') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN error_code TEXT;
            RAISE NOTICE 'Added error_code column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'agent_trigger_id') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN agent_trigger_id TEXT;
            RAISE NOTICE 'Added agent_trigger_id column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'agent_conversation_id') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN agent_conversation_id TEXT;
            RAISE NOTICE 'Added agent_conversation_id column to whatsapp_message_queue';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_message_queue' AND column_name = 'processed_at') THEN
            ALTER TABLE whatsapp_message_queue ADD COLUMN processed_at TIMESTAMPTZ;
            RAISE NOTICE 'Added processed_at column to whatsapp_message_queue';
        END IF;
        
    ELSE
        RAISE NOTICE 'whatsapp_message_queue table does not exist, creating...';
        
        -- Create the table with our desired structure
        CREATE TABLE whatsapp_message_queue (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            
            -- Queue Management
            queue_status TEXT NOT NULL DEFAULT 'pending' CHECK (queue_status IN ('pending', 'queued', 'processing', 'sent', 'failed', 'cancelled')),
            priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'immediate')),
            scheduled_for TIMESTAMPTZ,
            queued_at TIMESTAMPTZ DEFAULT NOW(),
            processed_at TIMESTAMPTZ,
            
            -- Message Content
            message_template TEXT NOT NULL,
            message_variables JSONB DEFAULT '{}',
            
            -- Processing Details
            attempts INTEGER DEFAULT 0,
            last_error TEXT,
            error_code TEXT,
            
            -- Agent DB Integration
            agent_trigger_id TEXT,
            agent_conversation_id TEXT,
            
            -- Metadata
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created whatsapp_message_queue table';
    END IF;
END $$;

-- 2. User Queue Settings Table (only if not exists)
CREATE TABLE IF NOT EXISTS user_queue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Business Hours (Israeli Time)
    business_hours JSONB DEFAULT '{
        "sunday": {"start": "09:00", "end": "17:00", "enabled": true},
        "monday": {"start": "09:00", "end": "17:00", "enabled": true},
        "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
        "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
        "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
        "friday": {"start": "09:00", "end": "13:00", "enabled": false},
        "saturday": {"enabled": false}
    }',
    
    -- Processing Targets
    target_leads_per_day INTEGER DEFAULT 45,
    target_leads_per_month INTEGER DEFAULT 1000,
    max_daily_capacity INTEGER DEFAULT 200,
    
    -- Automation Settings
    auto_queue_enabled BOOLEAN DEFAULT true,
    processing_delay_seconds INTEGER DEFAULT 120, -- 2 minutes
    batch_size INTEGER DEFAULT 10,
    
    -- Priority Weights (1-10)
    priority_weights JSONB DEFAULT '{
        "hot": 10,
        "warm": 7,
        "cool": 4,
        "cold": 2,
        "new_lead": 5,
        "follow_up": 8
    }',
    
    -- Holiday Settings
    exclude_holidays BOOLEAN DEFAULT true,
    custom_holidays JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update existing Queue Performance Metrics Table or create if not exists
DO $$
BEGIN
    -- Check if queue_performance_metrics table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'queue_performance_metrics' AND table_schema = 'public') THEN
        RAISE NOTICE 'queue_performance_metrics table exists, updating structure...';
        
        -- Add client_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'client_id') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added client_id column to queue_performance_metrics';
        END IF;
        
        -- Check if metric_date exists (rename from date_recorded if needed)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'metric_date') AND 
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'date_recorded') THEN
            ALTER TABLE queue_performance_metrics RENAME COLUMN date_recorded TO metric_date;
            RAISE NOTICE 'Renamed date_recorded to metric_date in queue_performance_metrics';
        END IF;
        
        -- Add missing columns for our queue system if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'leads_sent') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN leads_sent INTEGER DEFAULT 0;
            RAISE NOTICE 'Added leads_sent column to queue_performance_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'leads_cancelled') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN leads_cancelled INTEGER DEFAULT 0;
            RAISE NOTICE 'Added leads_cancelled column to queue_performance_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'failure_rate') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN failure_rate NUMERIC;
            RAISE NOTICE 'Added failure_rate column to queue_performance_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'hourly_distribution') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN hourly_distribution JSONB DEFAULT '{}';
            RAISE NOTICE 'Added hourly_distribution column to queue_performance_metrics';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue_performance_metrics' AND column_name = 'error_breakdown') THEN
            ALTER TABLE queue_performance_metrics ADD COLUMN error_breakdown JSONB DEFAULT '{}';
            RAISE NOTICE 'Added error_breakdown column to queue_performance_metrics';
        END IF;
        
    ELSE
        RAISE NOTICE 'queue_performance_metrics table does not exist, creating...';
        
        -- Create the table with our desired structure
        CREATE TABLE queue_performance_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            metric_date DATE NOT NULL,
            
            -- Daily Metrics
            leads_queued INTEGER DEFAULT 0,
            leads_processed INTEGER DEFAULT 0,
            leads_sent INTEGER DEFAULT 0,
            leads_failed INTEGER DEFAULT 0,
            leads_cancelled INTEGER DEFAULT 0,
            
            -- Performance Metrics
            average_processing_time_seconds NUMERIC,
            success_rate NUMERIC,
            failure_rate NUMERIC,
            
            -- Hourly Distribution
            hourly_distribution JSONB DEFAULT '{}',
            
            -- Error Analysis
            error_breakdown JSONB DEFAULT '{}',
            
            -- Metadata
            created_at TIMESTAMPTZ DEFAULT NOW(),
            
            UNIQUE(user_id, client_id, metric_date)
        );
        RAISE NOTICE 'Created queue_performance_metrics table';
    END IF;
END $$;

-- Create Performance Indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON whatsapp_message_queue(queue_status, priority DESC, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_queue_lead_id ON whatsapp_message_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON whatsapp_message_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_client_id ON whatsapp_message_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled_for ON whatsapp_message_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_queue_created_at ON whatsapp_message_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_queue_settings_user_id ON user_queue_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_queue_metrics_user_client_date ON queue_performance_metrics(user_id, client_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_queue_metrics_date ON queue_performance_metrics(metric_date);

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
    -- Check and enable RLS for whatsapp_message_queue
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
                  WHERE c.relname = 'whatsapp_message_queue' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
        ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for whatsapp_message_queue';
    END IF;
    
    -- Check and enable RLS for user_queue_settings  
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
                  WHERE c.relname = 'user_queue_settings' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
        ALTER TABLE user_queue_settings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for user_queue_settings';
    END IF;
    
    -- Check and enable RLS for queue_performance_metrics
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
                  WHERE c.relname = 'queue_performance_metrics' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
        ALTER TABLE queue_performance_metrics ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS for queue_performance_metrics';
    END IF;
END $$;

-- RLS Policies for whatsapp_message_queue (create only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_queue' AND policyname = 'Users can view their own queue items') THEN
        CREATE POLICY "Users can view their own queue items" ON whatsapp_message_queue
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_queue' AND policyname = 'Users can create queue items') THEN
        CREATE POLICY "Users can create queue items" ON whatsapp_message_queue
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_queue' AND policyname = 'Users can update their own queue items') THEN
        CREATE POLICY "Users can update their own queue items" ON whatsapp_message_queue
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_queue' AND policyname = 'Users can delete their own queue items') THEN
        CREATE POLICY "Users can delete their own queue items" ON whatsapp_message_queue
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for user_queue_settings (create only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_queue_settings' AND policyname = 'Users can view their own queue settings') THEN
        CREATE POLICY "Users can view their own queue settings" ON user_queue_settings
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_queue_settings' AND policyname = 'Users can create their own queue settings') THEN
        CREATE POLICY "Users can create their own queue settings" ON user_queue_settings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_queue_settings' AND policyname = 'Users can update their own queue settings') THEN
        CREATE POLICY "Users can update their own queue settings" ON user_queue_settings
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for queue_performance_metrics (create only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_performance_metrics' AND policyname = 'Users can view their own queue metrics') THEN
        CREATE POLICY "Users can view their own queue metrics" ON queue_performance_metrics
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_performance_metrics' AND policyname = 'Users can create their own queue metrics') THEN
        CREATE POLICY "Users can create their own queue metrics" ON queue_performance_metrics
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_performance_metrics' AND policyname = 'Users can update their own queue metrics') THEN
        CREATE POLICY "Users can update their own queue metrics" ON queue_performance_metrics
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_message_queue_updated_at') THEN
        CREATE TRIGGER update_whatsapp_message_queue_updated_at
            BEFORE UPDATE ON whatsapp_message_queue
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for whatsapp_message_queue updated_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_queue_settings_updated_at') THEN
        CREATE TRIGGER update_user_queue_settings_updated_at
            BEFORE UPDATE ON user_queue_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for user_queue_settings updated_at';
    END IF;
END $$;

-- Insert default queue settings for existing users (only for users without settings)
INSERT INTO user_queue_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_queue_settings WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
DECLARE
    queue_count INTEGER;
    settings_count INTEGER;
    metrics_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO queue_count FROM whatsapp_message_queue;
    SELECT COUNT(*) INTO settings_count FROM user_queue_settings;
    SELECT COUNT(*) INTO metrics_count FROM queue_performance_metrics;
    
    RAISE NOTICE 'Queue system migration completed successfully:';
    RAISE NOTICE 'whatsapp_message_queue: % records', queue_count;
    RAISE NOTICE 'user_queue_settings: % records', settings_count;
    RAISE NOTICE 'queue_performance_metrics: % records', metrics_count;
END $$;

COMMIT; 