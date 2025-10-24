-- FIXED: Drop and Recreate user_queue_settings with Correct Structure
-- This fixes the "column processing_targets does not exist" error

-- 1. DROP the existing table (it has wrong structure)
DROP TABLE IF EXISTS user_queue_settings CASCADE;
DROP TABLE IF EXISTS queue_performance_metrics CASCADE;

-- 2. CREATE user_queue_settings with CORRECT structure
CREATE TABLE user_queue_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Work Days Configuration (JSONB)
  work_days JSONB DEFAULT '{
    "enabled": true,
    "work_days": [1, 2, 3, 4, 5],
    "business_hours": {
      "start": "09:00",
      "end": "17:00", 
      "timezone": "Asia/Jerusalem"
    },
    "exclude_holidays": true,
    "custom_holidays": ["2025-01-01", "2025-12-25"]
  }',
  
  -- Processing Targets (JSONB)
  processing_targets JSONB DEFAULT '{
    "target_leads_per_month": 1000,
    "target_leads_per_work_day": 45,
    "max_daily_capacity": 200,
    "weekend_processing": {
      "enabled": false,
      "reduced_target_percentage": 25
    }
  }',
  
  -- Automation Settings (JSONB) 
  automation JSONB DEFAULT '{
    "auto_queue_preparation": true,
    "queue_preparation_time": "18:00",
    "auto_start_processing": false,
    "pause_on_weekends": true,
    "pause_on_holidays": true,
    "max_retry_attempts": 3,
    "retry_delay_minutes": 15
  }',
  
  -- Advanced Settings (JSONB)
  advanced JSONB DEFAULT '{
    "priority_scoring": {
      "enabled": true,
      "factors": ["heat_score", "bant_score", "days_since_contact"],
      "weights": {"heat_score": 0.4, "bant_score": 0.4, "days_since_contact": 0.2}
    },
    "batch_processing": {
      "enabled": true,
      "batch_size": 50,
      "batch_delay_seconds": 30
    },
    "rate_limiting": {
      "messages_per_hour": 1000,
      "messages_per_day": 10000,
      "respect_business_hours": true
    }
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 3. CREATE queue performance metrics table  
CREATE TABLE queue_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_recorded DATE DEFAULT CURRENT_DATE,
  
  -- Daily Metrics
  leads_processed INTEGER DEFAULT 0,
  leads_queued INTEGER DEFAULT 0,
  leads_failed INTEGER DEFAULT 0,
  average_processing_time_seconds INTEGER DEFAULT 0,
  
  -- Queue Stats
  peak_queue_size INTEGER DEFAULT 0,
  queue_wait_time_avg_minutes INTEGER DEFAULT 0,
  
  -- Performance Indicators
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  throughput_per_hour INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date_recorded)
);

-- 4. CREATE indexes for performance
CREATE INDEX idx_user_queue_settings_user_id ON user_queue_settings(user_id);
CREATE INDEX idx_queue_performance_metrics_user_date ON queue_performance_metrics(user_id, date_recorded);

-- 5. Enable RLS
ALTER TABLE user_queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS policies
CREATE POLICY "Users can manage their queue settings" ON user_queue_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their queue metrics" ON queue_performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- 7. Create update trigger for user_queue_settings
CREATE OR REPLACE FUNCTION update_queue_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_queue_settings_updated_at
    BEFORE UPDATE ON user_queue_settings
    FOR EACH ROW EXECUTE FUNCTION update_queue_settings_updated_at();

-- 8. INSERT queue settings for your test user
INSERT INTO user_queue_settings (user_id, work_days, processing_targets, automation, advanced)
VALUES (
  '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5', -- Your test user ID
  '{
    "enabled": true,
    "work_days": [1, 2, 3, 4, 5],
    "business_hours": {
      "start": "09:00",
      "end": "17:00",
      "timezone": "Asia/Jerusalem"
    },
    "exclude_holidays": true,
    "custom_holidays": ["2025-01-01", "2025-12-25"]
  }',
  '{
    "target_leads_per_month": 1000,
    "target_leads_per_work_day": 45,
    "max_daily_capacity": 200,
    "weekend_processing": {
      "enabled": false,
      "reduced_target_percentage": 25
    }
  }',
  '{
    "auto_queue_preparation": true,
    "queue_preparation_time": "18:00",
    "auto_start_processing": false,
    "pause_on_weekends": true,
    "pause_on_holidays": true,
    "max_retry_attempts": 3,
    "retry_delay_minutes": 15
  }',
  '{
    "priority_scoring": {
      "enabled": true,
      "factors": ["heat_score", "bant_score", "days_since_contact"],
      "weights": {"heat_score": 0.4, "bant_score": 0.4, "days_since_contact": 0.2}
    },
    "batch_processing": {
      "enabled": true,
      "batch_size": 50,
      "batch_delay_seconds": 30
    },
    "rate_limiting": {
      "messages_per_hour": 1000,
      "messages_per_day": 10000,
      "respect_business_hours": true
    }
  }'
);

-- 9. Initialize performance metrics for today
INSERT INTO queue_performance_metrics (user_id, leads_processed, leads_queued)
VALUES (
  '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5',
  2,  -- Leads Processed Today (from your analytics dashboard)
  14  -- Leads Queued for Tomorrow (from your analytics dashboard)
);

-- 10. VERIFY the setup worked
SELECT 
  'user_queue_settings' as table_name,
  COUNT(*) as record_count,
  user_id
FROM user_queue_settings 
WHERE user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'
GROUP BY user_id

UNION ALL

SELECT 
  'queue_performance_metrics' as table_name,
  COUNT(*) as record_count,
  user_id  
FROM queue_performance_metrics
WHERE user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'
GROUP BY user_id;

-- 11. Show current processing_state distribution
SELECT 
  processing_state,
  COUNT(*) as count
FROM leads 
GROUP BY processing_state 
ORDER BY count DESC;

-- 12. Show table structure to confirm it's correct
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_queue_settings' 
ORDER BY ordinal_position; 