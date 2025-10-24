-- CREATE MISSING TABLES - SQL for tables that exist in master but not in local
-- Run this SQL in Supabase SQL Editor to create missing table schemas
-- After creating tables, use migrate-missing-tables.js to insert data

-- =====================================================
-- AGENT INTERACTION LOGS (191 records ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_interaction_logs (
  interaction_log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  interaction_timestamp timestamptz DEFAULT now(),
  agent_input_context jsonb,
  agent_raw_output jsonb,
  n8n_determined_lead_state text,
  n8n_determined_lead_status text,
  n8n_determined_bant_status text,
  n8n_determined_bant_details jsonb,
  n8n_action_taken text,
  created_at timestamptz DEFAULT now(),
  triggering_message_id uuid
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agent_interaction_logs_lead_id ON agent_interaction_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_interaction_logs_timestamp ON agent_interaction_logs(interaction_timestamp);

-- =====================================================
-- CONVERSATION AUDIT LOG (14 records ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  action text NOT NULL,
  from_status text,
  to_status text,
  validation_mode text,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_conversation_id ON conversation_audit_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_created_at ON conversation_audit_log(created_at);

-- =====================================================
-- DASHBOARD BANT DISTRIBUTION (3 records ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_bant_distribution (
  bant_status text PRIMARY KEY,
  lead_count integer DEFAULT 0,
  avg_score text,
  percentage numeric(5,2),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- DASHBOARD BUSINESS KPIS (1 record ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_business_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_leads integer DEFAULT 0,
  qualified_leads integer DEFAULT 0,
  fully_qualified_leads integer DEFAULT 0,
  avg_lead_score text,
  new_leads integer DEFAULT 0,
  leads_today integer DEFAULT 0,
  leads_this_week integer DEFAULT 0,
  conversion_rate integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- DASHBOARD LEAD FUNNEL (3 records ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_lead_funnel (
  stage_name text PRIMARY KEY,
  lead_count integer DEFAULT 0,
  conversion_rate numeric(5,2),
  stage_order integer,
  updated_at timestamptz DEFAULT now()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_dashboard_lead_funnel_order ON dashboard_lead_funnel(stage_order);

-- =====================================================
-- DASHBOARD SYSTEM METRICS (1 record ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS dashboard_system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_queue_items_24h integer DEFAULT 0,
  processed_messages integer DEFAULT 0,
  queued_messages integer DEFAULT 0,
  failed_messages integer DEFAULT 0,
  processing_messages integer DEFAULT 0,
  avg_processing_time_seconds text,
  avg_queue_wait_time_seconds text,
  max_retry_count integer DEFAULT 0,
  avg_queue_priority integer DEFAULT 0,
  success_rate_percentage text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- LEAD STATUS HISTORY (138 records ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  status_type text NOT NULL,
  status text NOT NULL,
  previous_status text,
  reason text,
  status_metadata jsonb,
  changed_at timestamptz,
  changed_by text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_at ON lead_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_status ON lead_status_history(status);

-- =====================================================
-- EMPTY TABLES (for schema consistency)
-- =====================================================

-- Dashboard Error Analytics (empty in master)
CREATE TABLE IF NOT EXISTS dashboard_error_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text,
  error_message text,
  error_count integer DEFAULT 0,
  last_occurrence timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dashboard Queue Analytics (empty in master)  
CREATE TABLE IF NOT EXISTS dashboard_queue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name text,
  items_processed integer DEFAULT 0,
  avg_wait_time_seconds numeric(10,2),
  peak_queue_size integer DEFAULT 0,
  current_queue_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lead Project History (empty in master)
CREATE TABLE IF NOT EXISTS lead_project_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  from_project_id uuid,
  to_project_id uuid REFERENCES projects(id),
  moved_by text,
  reason text,
  moved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for lead project history
CREATE INDEX IF NOT EXISTS idx_lead_project_history_lead_id ON lead_project_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_project_history_moved_at ON lead_project_history(moved_at);

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE agent_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_bant_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_business_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_lead_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_error_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_queue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_project_history ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users for now)
-- You can customize these policies based on your security requirements

CREATE POLICY "Allow all for authenticated users" ON agent_interaction_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON conversation_audit_log
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_bant_distribution
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_business_kpis
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_lead_funnel
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_system_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON lead_status_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_error_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON dashboard_queue_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON lead_project_history
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE agent_interaction_logs IS 'Logs of AI agent interactions with leads';
COMMENT ON TABLE conversation_audit_log IS 'Audit trail for conversation status changes';
COMMENT ON TABLE dashboard_bant_distribution IS 'Dashboard data for BANT status distribution';
COMMENT ON TABLE dashboard_business_kpis IS 'Key business performance indicators for dashboard';
COMMENT ON TABLE dashboard_lead_funnel IS 'Lead funnel analytics for dashboard visualization';
COMMENT ON TABLE dashboard_system_metrics IS 'System performance metrics for monitoring';
COMMENT ON TABLE lead_status_history IS 'Historical record of lead status changes';
COMMENT ON TABLE dashboard_error_analytics IS 'Error tracking and analytics';
COMMENT ON TABLE dashboard_queue_analytics IS 'Queue performance monitoring';
COMMENT ON TABLE lead_project_history IS 'History of lead movements between projects'; 