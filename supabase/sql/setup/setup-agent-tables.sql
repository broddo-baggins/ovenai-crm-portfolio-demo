-- Create agent_lead_staging table for site bridge
CREATE TABLE IF NOT EXISTS agent_lead_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_staging_id UUID,
  lead_data JSONB NOT NULL,
  processing_status TEXT DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'error')),
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_flow_processed table
CREATE TABLE IF NOT EXISTS lead_flow_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id UUID REFERENCES agent_lead_staging(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  industry TEXT,
  project_type TEXT,
  budget_range TEXT,
  timeline TEXT,
  requirements TEXT,
  lead_score INTEGER CHECK (lead_score BETWEEN 0 AND 100),
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D')),
  qualification_status TEXT CHECK (qualification_status IN ('qualified', 'unqualified', 'pending')),
  ai_analysis JSONB,
  status TEXT DEFAULT 'processed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_log table
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  target_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_id UUID,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
GRANT ALL ON agent_lead_staging TO anon, authenticated, service_role;
GRANT ALL ON lead_flow_processed TO anon, authenticated, service_role;
GRANT ALL ON sync_log TO anon, authenticated, service_role;

-- Enable RLS with permissive policies
ALTER TABLE agent_lead_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_flow_processed ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agent_lead_staging" ON agent_lead_staging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lead_flow_processed" ON lead_flow_processed FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sync_log" ON sync_log FOR ALL USING (true) WITH CHECK (true);