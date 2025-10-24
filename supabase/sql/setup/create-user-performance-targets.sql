-- Manual database setup script for user_performance_targets table
-- Run this in your Supabase SQL editor if the migration fails

-- Create user performance targets table
CREATE TABLE IF NOT EXISTS user_performance_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Target metrics
    target_leads_per_month INTEGER DEFAULT 100,
    target_conversion_rate DECIMAL(5,2) DEFAULT 15.0, -- percentage
    target_meetings_per_month INTEGER DEFAULT 20,
    target_messages_per_week INTEGER DEFAULT 150,
    target_response_rate DECIMAL(5,2) DEFAULT 70.0, -- percentage
    target_reach_rate DECIMAL(5,2) DEFAULT 85.0, -- percentage
    
    -- BANT/HEAT specific targets
    target_bant_qualification_rate DECIMAL(5,2) DEFAULT 70.0, -- percentage
    target_cold_to_warm_rate DECIMAL(5,2) DEFAULT 40.0, -- percentage
    target_warm_to_hot_rate DECIMAL(5,2) DEFAULT 60.0, -- percentage
    target_hot_to_burning_rate DECIMAL(5,2) DEFAULT 80.0, -- percentage
    target_burning_to_meeting_rate DECIMAL(5,2) DEFAULT 75.0, -- percentage
    target_calendly_booking_rate DECIMAL(5,2) DEFAULT 25.0, -- percentage
    
    -- Custom metrics (JSON for flexibility)
    custom_targets JSONB DEFAULT '{}',
    
    -- Metadata  
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, client_id, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_performance_targets_user_id ON user_performance_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_targets_client_id ON user_performance_targets(client_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_targets_project_id ON user_performance_targets(project_id);

-- Enable RLS
ALTER TABLE user_performance_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own performance targets" ON user_performance_targets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance targets" ON user_performance_targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance targets" ON user_performance_targets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance targets" ON user_performance_targets
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_performance_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_user_performance_targets_updated_at
    BEFORE UPDATE ON user_performance_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_performance_targets_updated_at(); 