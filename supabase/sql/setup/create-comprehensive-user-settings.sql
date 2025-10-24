-- Comprehensive User Settings Persistence System
-- This creates tables for all user settings, preferences, and application state

-- 1. User Dashboard Settings
CREATE TABLE IF NOT EXISTS user_dashboard_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Widget Visibility Settings
    widget_visibility JSONB DEFAULT '{
        "metrics": true,
        "monthlyPerformance": true,
        "leadsConversions": true,
        "revenueChannel": true,
        "pieCharts": true,
        "recentActivity": true,
        "insights": true,
        "performanceTargets": true
    }',
    
    -- Widget Layout and Positions
    widget_layout JSONB DEFAULT '[]',
    
    -- Dashboard Preferences
    dashboard_preferences JSONB DEFAULT '{
        "defaultView": "enhanced",
        "autoRefresh": true,
        "refreshInterval": 300000,
        "compactMode": false,
        "showTooltips": true,
        "animationsEnabled": true
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, client_id, project_id)
);

-- 2. User Notification Settings
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Email Notifications
    email_notifications JSONB DEFAULT '{
        "leadUpdates": true,
        "meetingReminders": true,
        "systemAlerts": true,
        "weeklyReports": true,
        "bantQualifications": true,
        "calendlyBookings": true,
        "heatProgressions": true
    }',
    
    -- Push Notifications
    push_notifications JSONB DEFAULT '{
        "leadUpdates": true,
        "meetingReminders": true,
        "systemAlerts": true,
        "realTimeUpdates": false
    }',
    
    -- SMS Notifications
    sms_notifications JSONB DEFAULT '{
        "urgentAlerts": false,
        "meetingReminders": false,
        "leadUpdates": false
    }',
    
    -- Notification Timing
    notification_schedule JSONB DEFAULT '{
        "workingHours": {"start": "09:00", "end": "18:00"},
        "timezone": "UTC",
        "weekends": false,
        "quietHours": {"enabled": true, "start": "22:00", "end": "08:00"}
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 3. User Application Preferences
CREATE TABLE IF NOT EXISTS user_app_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Interface Preferences
    interface_settings JSONB DEFAULT '{
        "theme": "system",
        "language": "en",
        "rtl": false,
        "density": "comfortable",
        "sidebarCollapsed": false,
        "colorScheme": "default"
    }',
    
    -- Data Display Preferences
    data_preferences JSONB DEFAULT '{
        "dateFormat": "MM/DD/YYYY",
        "timeFormat": "12h",
        "numberFormat": "en-US",
        "currency": "USD",
        "pagination": 25,
        "sortPreferences": {}
    }',
    
    -- Feature Flags
    feature_preferences JSONB DEFAULT '{
        "betaFeatures": false,
        "advancedMode": false,
        "debugMode": false,
        "analytics": true,
        "tutorials": true
    }',
    
    -- Integration Settings
    integration_settings JSONB DEFAULT '{
        "calendly": {"enabled": false, "autoSync": false},
        "whatsapp": {"enabled": true, "autoSync": true},
        "email": {"enabled": false, "provider": null}
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 4. User Performance Targets (Enhanced)
-- This table already exists but let's make sure it's comprehensive
CREATE TABLE IF NOT EXISTS user_performance_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Basic Targets
    target_leads_per_month INTEGER DEFAULT 100,
    target_conversion_rate DECIMAL(5,2) DEFAULT 15.0,
    target_meetings_per_month INTEGER DEFAULT 20,
    target_messages_per_week INTEGER DEFAULT 150,
    target_response_rate DECIMAL(5,2) DEFAULT 70.0,
    target_reach_rate DECIMAL(5,2) DEFAULT 85.0,
    
    -- BANT/HEAT Specific Targets
    target_bant_qualification_rate DECIMAL(5,2) DEFAULT 70.0,
    target_cold_to_warm_rate DECIMAL(5,2) DEFAULT 40.0,
    target_warm_to_hot_rate DECIMAL(5,2) DEFAULT 60.0,
    target_hot_to_burning_rate DECIMAL(5,2) DEFAULT 80.0,
    target_burning_to_meeting_rate DECIMAL(5,2) DEFAULT 75.0,
    target_calendly_booking_rate DECIMAL(5,2) DEFAULT 25.0,
    
    -- Custom Targets
    custom_targets JSONB DEFAULT '{}',
    
    -- Target Periods
    target_period JSONB DEFAULT '{
        "type": "monthly",
        "startDate": null,
        "endDate": null,
        "recurring": true
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, client_id, project_id)
);

-- 5. User Session State (for temporary preferences)
CREATE TABLE IF NOT EXISTS user_session_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    
    -- Current Context
    current_context JSONB DEFAULT '{
        "selectedProject": null,
        "selectedClient": null,
        "currentPage": "dashboard",
        "filters": {},
        "searches": {}
    }',
    
    -- Temporary UI State
    ui_state JSONB DEFAULT '{
        "openPanels": [],
        "selectedItems": [],
        "viewModes": {},
        "temporarySettings": {}
    }',
    
    -- Last Activity
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_user_id ON user_dashboard_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_project_id ON user_dashboard_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_preferences_user_id ON user_app_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_state_user_id ON user_session_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_state_session_id ON user_session_state(session_id);
CREATE INDEX IF NOT EXISTS idx_user_session_state_expires_at ON user_session_state(expires_at);

-- Enable RLS for all tables
ALTER TABLE user_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Dashboard Settings
CREATE POLICY "Users can manage their dashboard settings" ON user_dashboard_settings
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Notification Settings  
CREATE POLICY "Users can manage their notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for App Preferences
CREATE POLICY "Users can manage their app preferences" ON user_app_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Session State
CREATE POLICY "Users can manage their session state" ON user_session_state
    FOR ALL USING (auth.uid() = user_id);

-- Update triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_dashboard_settings_updated_at
    BEFORE UPDATE ON user_dashboard_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_app_preferences_updated_at
    BEFORE UPDATE ON user_app_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_session_state_updated_at
    BEFORE UPDATE ON user_session_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_session_state WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 0 * * *', 'SELECT cleanup_expired_sessions();'); 