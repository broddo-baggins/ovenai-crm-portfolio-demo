-- Comprehensive User Settings Persistence System (SAFE VERSION)
-- This creates tables for all user settings, preferences, and application state
-- Handles existing policies gracefully

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

-- 4. User Session State (for temporary preferences)
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

-- 5. Notifications Table (for the notification system)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('success', 'info', 'warning', 'error')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS for all tables
ALTER TABLE user_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their dashboard settings" ON user_dashboard_settings;
    DROP POLICY IF EXISTS "Users can manage their notification settings" ON user_notification_settings;
    DROP POLICY IF EXISTS "Users can manage their app preferences" ON user_app_preferences;
    DROP POLICY IF EXISTS "Users can manage their session state" ON user_session_state;
    DROP POLICY IF EXISTS "Users can manage their notifications" ON notifications;
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, continue
        NULL;
END $$;

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

-- RLS Policies for Notifications
CREATE POLICY "Users can manage their notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Update triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_dashboard_settings_updated_at ON user_dashboard_settings;
DROP TRIGGER IF EXISTS update_user_notification_settings_updated_at ON user_notification_settings;
DROP TRIGGER IF EXISTS update_user_app_preferences_updated_at ON user_app_preferences;
DROP TRIGGER IF EXISTS update_user_session_state_updated_at ON user_session_state;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- Create triggers
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

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
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

-- Test notification insertion
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first available user for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, read, action_url, metadata) VALUES
        (
            test_user_id,
            'Welcome to OvenAI BANT/HEAT System!',
            'Your lead qualification dashboard is now connected and tracking BANT progression.',
            'success',
            false,
            '/dashboard',
            '{"category": "system", "priority": "high", "feature": "bant_heat"}'::jsonb
        ),
        (
            test_user_id,
            'BANT Qualification Alert',
            'New leads are ready for BANT qualification review.',
            'info',
            false,
            '/leads',
            '{"category": "bant", "priority": "medium"}'::jsonb
        );
    END IF;
END $$; 