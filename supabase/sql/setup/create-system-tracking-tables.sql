-- ======================================================
-- SYSTEM CHANGE TRACKING TABLES
-- ======================================================
-- These tables track system changes without interfering 
-- with the main leads, projects, and messages tables
-- ======================================================

-- System Changes Table
-- Tracks individual changes to entities in the system
CREATE TABLE IF NOT EXISTS system_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'project', 'message', 'meeting', 'system')),
  entity_id TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'status_changed')),
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregated Notifications Table  
-- Provides consolidated notifications ("X leads updated" instead of 100 individual notifications)
CREATE TABLE IF NOT EXISTS aggregated_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('leads', 'projects', 'messages', 'meetings')),
  count INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================

-- System Changes Indexes
CREATE INDEX IF NOT EXISTS idx_system_changes_user_id ON system_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_system_changes_entity_type ON system_changes(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_changes_entity_id ON system_changes(entity_id);
CREATE INDEX IF NOT EXISTS idx_system_changes_change_type ON system_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_system_changes_created_at ON system_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_changes_is_read ON system_changes(is_read);
CREATE INDEX IF NOT EXISTS idx_system_changes_user_entity ON system_changes(user_id, entity_type);

-- Aggregated Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_user_id ON aggregated_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_type ON aggregated_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_is_read ON aggregated_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_last_updated ON aggregated_notifications(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_user_type_read ON aggregated_notifications(user_id, notification_type, is_read);

-- ======================================================
-- ROW LEVEL SECURITY (RLS)
-- ======================================================

-- Enable RLS on both tables
ALTER TABLE system_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_notifications ENABLE ROW LEVEL SECURITY;

-- System Changes RLS Policies
CREATE POLICY "Users can view their own system changes" ON system_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own system changes" ON system_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system changes" ON system_changes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own system changes" ON system_changes
  FOR DELETE USING (auth.uid() = user_id);

-- Aggregated Notifications RLS Policies
CREATE POLICY "Users can view their own aggregated notifications" ON aggregated_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aggregated notifications" ON aggregated_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aggregated notifications" ON aggregated_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aggregated notifications" ON aggregated_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ======================================================
-- UPDATED_AT TRIGGERS
-- ======================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_system_changes_updated_at 
  BEFORE UPDATE ON system_changes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aggregated_notifications_updated_at 
  BEFORE UPDATE ON aggregated_notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================================
-- CLEANUP FUNCTION
-- ======================================================

-- Function to clean up old system changes (older than 90 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_system_changes(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_changes 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- NOTIFICATION FUNCTIONS
-- ======================================================

-- Function to get notification summary for a user
CREATE OR REPLACE FUNCTION get_notification_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_unread', COALESCE(SUM(count), 0),
    'by_type', json_agg(
      json_build_object(
        'type', notification_type,
        'count', count,
        'last_updated', last_updated
      )
    )
  )
  INTO result
  FROM aggregated_notifications
  WHERE user_id = p_user_id AND is_read = FALSE;
  
  RETURN COALESCE(result, '{"total_unread": 0, "by_type": []}'::json);
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- GRANTS
-- ======================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON system_changes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON aggregated_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_system_changes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_summary(UUID) TO authenticated;

-- ======================================================
-- COMMENTS
-- ======================================================

COMMENT ON TABLE system_changes IS 'Tracks all system changes for audit and notification purposes';
COMMENT ON TABLE aggregated_notifications IS 'Provides aggregated notifications to avoid notification spam';
COMMENT ON FUNCTION cleanup_old_system_changes(INTEGER) IS 'Cleans up old system changes to keep table size manageable';
COMMENT ON FUNCTION get_notification_summary(UUID) IS 'Returns notification summary for a user';

-- ======================================================
-- SUCCESS MESSAGE
-- ======================================================

DO $$
BEGIN
  RAISE NOTICE '✅ System change tracking tables created successfully!';
  RAISE NOTICE '📊 Tables: system_changes, aggregated_notifications';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🧹 Cleanup functions available';
END
$$; 