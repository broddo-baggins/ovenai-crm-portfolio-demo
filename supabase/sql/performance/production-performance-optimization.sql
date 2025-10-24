-- =====================================================
-- Production Performance Optimization
-- Comprehensive database indexing and query optimization
-- =====================================================

-- Enable required extensions for performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- CORE TABLE INDEXES
-- =====================================================

-- LEADS table optimization
CREATE INDEX IF NOT EXISTS idx_leads_processing_state 
ON leads(processing_state) 
WHERE processing_state IN ('pending', 'queued', 'active');

CREATE INDEX IF NOT EXISTS idx_leads_status_active 
ON leads(status, updated_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_leads_client_id_active 
ON leads(client_id) 
WHERE processing_state != 'completed';

CREATE INDEX IF NOT EXISTS idx_leads_phone_lookup 
ON leads(phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_created_date 
ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_last_interaction 
ON leads(last_interaction DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_leads_compound_active 
ON leads(client_id, processing_state, updated_at DESC) 
WHERE processing_state IN ('pending', 'queued', 'active');

-- Full-text search on leads
CREATE INDEX IF NOT EXISTS idx_leads_search 
ON leads USING gin((first_name || ' ' || last_name || ' ' || COALESCE(company, '')) gin_trgm_ops);

-- =====================================================
-- CONVERSATION TABLE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id 
ON conversations(lead_id);

CREATE INDEX IF NOT EXISTS idx_conversations_client_date 
ON conversations(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_active 
ON conversations(lead_id, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conversations_unread 
ON conversations(lead_id) 
WHERE read = false;

-- =====================================================
-- MESSAGES TABLE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_date 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_type 
ON messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id 
ON messages(whatsapp_message_id) 
WHERE whatsapp_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status 
ON messages(delivery_status, created_at DESC) 
WHERE delivery_status IN ('pending', 'failed');

-- Full-text search on message content
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
ON messages USING gin(content gin_trgm_ops);

-- =====================================================
-- QUEUE SYSTEM INDEXES
-- =====================================================

-- Lead Processing Queue
CREATE INDEX IF NOT EXISTS idx_lead_queue_priority 
ON lead_processing_queue(priority DESC, queue_position ASC) 
WHERE queue_status = 'queued';

CREATE INDEX IF NOT EXISTS idx_lead_queue_scheduled 
ON lead_processing_queue(scheduled_for ASC) 
WHERE queue_status = 'queued' AND scheduled_for <= NOW();

CREATE INDEX IF NOT EXISTS idx_lead_queue_processing 
ON lead_processing_queue(updated_at DESC) 
WHERE queue_status = 'processing';

CREATE INDEX IF NOT EXISTS idx_lead_queue_retry 
ON lead_processing_queue(retry_count, last_attempt) 
WHERE queue_status = 'failed' AND retry_count < 3;

-- WhatsApp Message Queue
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_priority 
ON whatsapp_message_queue(priority DESC, created_at ASC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_scheduled 
ON whatsapp_message_queue(scheduled_for ASC) 
WHERE status = 'pending' AND scheduled_for <= NOW();

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_rate_limit 
ON whatsapp_message_queue(client_id, created_at DESC) 
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Background Jobs
CREATE INDEX IF NOT EXISTS idx_background_jobs_status 
ON background_jobs(status, scheduled_for ASC) 
WHERE status IN ('pending', 'retry');

CREATE INDEX IF NOT EXISTS idx_background_jobs_type 
ON background_jobs(job_type, created_at DESC);

-- =====================================================
-- USER AND AUTHENTICATION INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_client_role 
ON profiles(client_id, role) 
WHERE client_id IS NOT NULL;

-- User Settings Tables
CREATE INDEX IF NOT EXISTS idx_user_preferences_user 
ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_queue_settings_user 
ON user_queue_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user 
ON user_notification_settings(user_id);

-- =====================================================
-- ANALYTICS AND REPORTING INDEXES
-- =====================================================

-- Aggregated Notifications
CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_user_unread 
ON aggregated_notifications(user_id, read) 
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_aggregated_notifications_type_date 
ON aggregated_notifications(notification_type, created_at DESC);

-- Queue Performance Metrics
CREATE INDEX IF NOT EXISTS idx_queue_metrics_date 
ON queue_performance_metrics(date DESC);

CREATE INDEX IF NOT EXISTS idx_queue_metrics_client 
ON queue_performance_metrics(client_id, date DESC);

-- =====================================================
-- PARTIAL AND CONDITIONAL INDEXES
-- =====================================================

-- Hot leads (high priority)
CREATE INDEX IF NOT EXISTS idx_leads_hot 
ON leads(updated_at DESC, score DESC) 
WHERE score >= 80 AND processing_state != 'completed';

-- Recent conversations (last 30 days)
CREATE INDEX IF NOT EXISTS idx_conversations_recent 
ON conversations(client_id, updated_at DESC) 
WHERE updated_at >= NOW() - INTERVAL '30 days';

-- Failed messages for retry
CREATE INDEX IF NOT EXISTS idx_messages_failed_retry 
ON messages(created_at DESC) 
WHERE delivery_status = 'failed' AND retry_count < 3;

-- Active business hours processing
CREATE INDEX IF NOT EXISTS idx_queue_business_hours 
ON lead_processing_queue(client_id, scheduled_for ASC) 
WHERE queue_status = 'queued' 
AND EXTRACT(hour FROM scheduled_for) BETWEEN 9 AND 17 
AND EXTRACT(dow FROM scheduled_for) BETWEEN 1 AND 5;

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Lead dashboard query optimization
CREATE INDEX IF NOT EXISTS idx_leads_dashboard 
ON leads(client_id, processing_state, created_at DESC, score DESC) 
WHERE processing_state IN ('pending', 'queued', 'active');

-- Conversation list with message count
CREATE INDEX IF NOT EXISTS idx_conversation_messages 
ON messages(conversation_id, created_at DESC);

-- WhatsApp delivery tracking
CREATE INDEX IF NOT EXISTS idx_whatsapp_delivery_tracking 
ON messages(whatsapp_message_id, delivery_status, updated_at DESC) 
WHERE whatsapp_message_id IS NOT NULL;

-- =====================================================
-- STATISTICS UPDATES
-- =====================================================

-- Update table statistics for better query planning
ANALYZE leads;
ANALYZE conversations;
ANALYZE messages;
ANALYZE lead_processing_queue;
ANALYZE whatsapp_message_queue;
ANALYZE background_jobs;
ANALYZE profiles;
ANALYZE aggregated_notifications;

-- =====================================================
-- QUERY OPTIMIZATION VIEWS
-- =====================================================

-- High-performance lead summary view
CREATE OR REPLACE VIEW lead_summary_optimized AS
SELECT 
    l.id,
    l.client_id,
    l.first_name,
    l.last_name,
    l.phone,
    l.processing_state,
    l.status,
    l.score,
    l.created_at,
    l.updated_at,
    l.last_interaction,
    -- Pre-calculated conversation count
    COALESCE(conv_stats.conversation_count, 0) as conversation_count,
    -- Pre-calculated latest message
    conv_stats.latest_message_at,
    -- Queue information
    queue.queue_position,
    queue.priority as queue_priority
FROM leads l
LEFT JOIN (
    SELECT 
        lead_id,
        COUNT(*) as conversation_count,
        MAX(created_at) as latest_message_at
    FROM conversations 
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY lead_id
) conv_stats ON l.id = conv_stats.lead_id
LEFT JOIN lead_processing_queue queue ON l.id = queue.lead_id 
    AND queue.queue_status = 'queued';

-- WhatsApp message performance view
CREATE OR REPLACE VIEW whatsapp_message_performance AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    client_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE delivery_status = 'pending') as pending_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_delivery_time_seconds
FROM messages 
WHERE whatsapp_message_id IS NOT NULL 
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour_bucket, client_id
ORDER BY hour_bucket DESC;

-- =====================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    max_time DOUBLE PRECISION
) 
LANGUAGE SQL
AS $$
    SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
    FROM pg_stat_statements 
    WHERE mean_time > min_duration_ms
    ORDER BY mean_time DESC
    LIMIT 20;
$$;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    size_pretty TEXT,
    size_bytes BIGINT,
    row_count BIGINT
) 
LANGUAGE SQL
AS $$
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        n_tup_ins - n_tup_del as row_count
    FROM pg_stat_user_tables 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- =====================================================
-- PERFORMANCE MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to update statistics automatically
CREATE OR REPLACE FUNCTION update_performance_statistics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update statistics on critical tables
    ANALYZE leads;
    ANALYZE conversations;
    ANALYZE messages;
    ANALYZE lead_processing_queue;
    ANALYZE whatsapp_message_queue;
    
    -- Log the maintenance
    INSERT INTO background_jobs (job_type, status, details, created_at)
    VALUES ('statistics_update', 'completed', 'Automatic statistics update completed', NOW());
    
    RAISE NOTICE 'Performance statistics updated successfully';
END;
$$;

-- =====================================================
-- VACUUM AND MAINTENANCE CONFIGURATION
-- =====================================================

-- Set optimal autovacuum settings for high-traffic tables
ALTER TABLE leads SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE messages SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE conversations SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- =====================================================
-- CONNECTION AND RESOURCE OPTIMIZATION
-- =====================================================

-- Set optimal work_mem for complex queries (per connection)
-- Note: This should be set in postgresql.conf for production
-- work_mem = 256MB for analytics queries
-- shared_buffers = 25% of total RAM
-- effective_cache_size = 75% of total RAM
-- max_connections = 200 (adjust based on workload)

-- =====================================================
-- PERFORMANCE TESTING QUERIES
-- =====================================================

-- Test query performance with EXPLAIN ANALYZE
-- These are examples for performance validation

/*
-- Test lead dashboard query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM lead_summary_optimized 
WHERE client_id = 'test-client' 
AND processing_state IN ('pending', 'queued', 'active')
ORDER BY score DESC, updated_at DESC 
LIMIT 50;

-- Test conversation loading
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.*, 
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
FROM conversations c 
WHERE c.lead_id = 'test-lead-id'
ORDER BY c.updated_at DESC;

-- Test WhatsApp queue processing
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM whatsapp_message_queue 
WHERE status = 'pending' 
AND scheduled_for <= NOW()
ORDER BY priority DESC, created_at ASC 
LIMIT 100;
*/

-- =====================================================
-- FINAL OPTIMIZATIONS
-- =====================================================

-- Create a performance monitoring view
CREATE OR REPLACE VIEW system_performance_summary AS
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Active Connections',
    COUNT(*)::text
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
    'Slow Queries (>1s)',
    COUNT(*)::text
FROM pg_stat_statements 
WHERE mean_time > 1000
UNION ALL
SELECT 
    'Cache Hit Ratio',
    ROUND(
        (sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0))::numeric, 
        2
    )::text || '%'
FROM pg_stat_database;

-- Grant necessary permissions
GRANT SELECT ON system_performance_summary TO authenticated;
GRANT SELECT ON lead_summary_optimized TO authenticated;
GRANT SELECT ON whatsapp_message_performance TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Performance optimization completed successfully!';
    RAISE NOTICE 'Created % indexes for production optimization', 
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE 'Database is now optimized for production scale';
END;
$$; 