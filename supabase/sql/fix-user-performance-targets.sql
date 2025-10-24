-- Fix user_performance_targets table issues
-- This script addresses 406 (Not Acceptable) errors when accessing user_performance_targets

-- Drop existing table if it has issues
DROP TABLE IF EXISTS user_performance_targets CASCADE;

-- Create user performance targets table with proper structure
CREATE TABLE user_performance_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID,
    project_id UUID,
    
    -- Target metrics
    target_leads_per_month INTEGER DEFAULT 100,
    target_conversion_rate DECIMAL(5,2) DEFAULT 15.0,
    target_meetings_per_month INTEGER DEFAULT 20,
    target_messages_per_week INTEGER DEFAULT 150,
    target_response_rate DECIMAL(5,2) DEFAULT 70.0,
    target_reach_rate DECIMAL(5,2) DEFAULT 85.0,
    
    -- BANT/HEAT specific targets
    target_bant_qualification_rate DECIMAL(5,2) DEFAULT 70.0,
    target_cold_to_warm_rate DECIMAL(5,2) DEFAULT 40.0,
    target_warm_to_hot_rate DECIMAL(5,2) DEFAULT 60.0,
    target_hot_to_burning_rate DECIMAL(5,2) DEFAULT 80.0,
    target_burning_to_meeting_rate DECIMAL(5,2) DEFAULT 75.0,
    target_calendly_booking_rate DECIMAL(5,2) DEFAULT 25.0,
    
    -- Custom metrics (JSON for flexibility)
    custom_targets JSONB DEFAULT '{}',
    
    -- Metadata  
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, client_id, project_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_performance_targets_user_id ON user_performance_targets(user_id);
CREATE INDEX idx_user_performance_targets_client_id ON user_performance_targets(client_id);
CREATE INDEX idx_user_performance_targets_project_id ON user_performance_targets(project_id);

-- Enable RLS
ALTER TABLE user_performance_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own performance targets" ON user_performance_targets;
DROP POLICY IF EXISTS "Users can insert their own performance targets" ON user_performance_targets;
DROP POLICY IF EXISTS "Users can update their own performance targets" ON user_performance_targets;
DROP POLICY IF EXISTS "Users can delete their own performance targets" ON user_performance_targets;

-- Create RLS Policies with proper authentication
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_performance_targets_updated_at ON user_performance_targets;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_user_performance_targets_updated_at
    BEFORE UPDATE ON user_performance_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_performance_targets_updated_at();

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_performance_targets TO authenticated;
GRANT USAGE ON SEQUENCE user_performance_targets_id_seq TO authenticated;

-- Create a test record for the current user (if authenticated)
-- This will help verify the table is working correctly
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO user_performance_targets (
            user_id,
            target_leads_per_month,
            target_conversion_rate,
            target_meetings_per_month,
            target_messages_per_week,
            target_response_rate,
            target_reach_rate,
            target_bant_qualification_rate,
            target_cold_to_warm_rate,
            target_warm_to_hot_rate,
            target_hot_to_burning_rate,
            target_burning_to_meeting_rate,
            target_calendly_booking_rate
        ) VALUES (
            auth.uid(),
            100,
            15.0,
            20,
            150,
            70.0,
            85.0,
            70.0,
            40.0,
            60.0,
            80.0,
            75.0,
            25.0
        )
        ON CONFLICT (user_id, client_id, project_id) DO NOTHING;
    END IF;
END $$; 