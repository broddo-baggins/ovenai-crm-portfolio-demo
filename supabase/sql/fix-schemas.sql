-- 🔧 FIX ALL SCHEMAS FOR SUCCESSFUL MIGRATION
-- This SQL updates your local tables to match the master database structure

-- =================================================================
-- 1. UPDATE CLIENTS TABLE
-- =================================================================

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS whatsapp_number_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(50);

-- =================================================================
-- 2. UPDATE PROJECTS TABLE  
-- =================================================================

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- =================================================================
-- 3. UPDATE LEADS TABLE (MAJOR CHANGES)
-- =================================================================

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
ADD COLUMN IF NOT EXISTS current_project_id UUID REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS bant_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS state_status_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lead_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_message_from VARCHAR(50),
ADD COLUMN IF NOT EXISTS first_interaction TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_agent_processed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_current_project_id ON public.leads(current_project_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON public.leads(state);
CREATE INDEX IF NOT EXISTS idx_leads_bant_status ON public.leads(bant_status); 