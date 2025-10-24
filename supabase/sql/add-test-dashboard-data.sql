-- Add test data for dashboard analytics
-- This script creates sample leads to test the dashboard metrics

-- Insert sample leads with different BANT statuses and states
INSERT INTO leads (
  id, 
  first_name, 
  last_name, 
  email, 
  phone, 
  status, 
  state,
  bant_status,
  interaction_count,
  first_interaction,
  last_interaction,
  requires_human_review,
  created_at,
  updated_at,
  current_project_id
) VALUES 
  -- Hot/Burning leads (qualified)
  (gen_random_uuid(), 'John', 'Smith', 'john@example.com', '+1234567890', 'qualified', 'qualified_for_meeting', 'fully_qualified', 5, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Sarah', 'Jones', 'sarah@company.com', '+1234567891', 'Demo Scheduled', 'meeting_set', 'budget_qualified', 8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Mike', 'Johnson', 'mike@business.co', '+1234567892', 'Proposal Sent', 'evaluation', 'authority_qualified', 12, NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 hours', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 hours', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Lisa', 'Wilson', 'lisa@startup.io', '+1234567893', 'Negotiation', 'purchase_ready', 'timing_qualified', 15, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 hours', (SELECT id FROM projects LIMIT 1)),
  
  -- Warm leads (partially qualified)
  (gen_random_uuid(), 'David', 'Brown', 'david@corp.com', '+1234567894', 'interest', 'consideration', 'partially_qualified', 3, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Emma', 'Davis', 'emma@tech.net', '+1234567895', 'intent', 'interest', 'need_qualified', 4, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Chris', 'Miller', 'chris@biz.org', '+1234567896', 'consideration', 'awareness', 'partially_qualified', 2, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days', (SELECT id FROM projects LIMIT 1)),
  
  -- Cold leads (unqualified)
  (gen_random_uuid(), 'Anna', 'Garcia', 'anna@email.com', '+1234567897', 'unqualified', 'awareness', 'unqualified', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Tom', 'Taylor', 'tom@test.com', '+1234567898', 'awareness', 'unqualified', 'unqualified', 0, NOW() - INTERVAL '15 days', NULL, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Kate', 'Anderson', 'kate@example.org', '+1234567899', 'unqualified', 'awareness', 'unqualified', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '18 days', (SELECT id FROM projects LIMIT 1)),
  
  -- Recent leads (this week)
  (gen_random_uuid(), 'Alex', 'White', 'alex@recent.com', '+1234567800', 'qualified', 'interest', 'budget_qualified', 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Jessica', 'Moore', 'jess@new.co', '+1234567801', 'Demo Scheduled', 'qualified_for_meeting', 'fully_qualified', 6, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '3 hours', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours', (SELECT id FROM projects LIMIT 1)),
  
  -- Older leads (for trend comparison)
  (gen_random_uuid(), 'Ryan', 'Clark', 'ryan@old.com', '+1234567802', 'qualified', 'evaluation', 'authority_qualified', 7, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '8 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Megan', 'Lewis', 'megan@past.org', '+1234567803', 'intent', 'consideration', 'need_qualified', 4, NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', false, NOW() - INTERVAL '16 days', NOW() - INTERVAL '10 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Jack', 'Hall', 'jack@history.net', '+1234567804', 'Proposal Sent', 'purchase_ready', 'timing_qualified', 9, NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '12 days', (SELECT id FROM projects LIMIT 1))

-- Only insert if there are fewer than 10 leads (to avoid duplicates)
ON CONFLICT (email) DO NOTHING;

-- Verify the data was inserted
SELECT 
  'Test data created successfully' as result,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN bant_status IN ('fully_qualified', 'budget_qualified', 'authority_qualified', 'need_qualified', 'timing_qualified') THEN 1 END) as qualified_leads,
  COUNT(CASE WHEN requires_human_review = true THEN 1 END) as meeting_pipeline_leads,
  COUNT(CASE WHEN interaction_count > 0 THEN 1 END) as contacted_leads
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Also create some older leads for better trend analysis
INSERT INTO leads (
  id, 
  first_name, 
  last_name, 
  email, 
  phone, 
  status, 
  state,
  bant_status,
  interaction_count,
  first_interaction,
  last_interaction,
  requires_human_review,
  created_at,
  updated_at,
  current_project_id
) VALUES 
  -- Previous week leads for trend comparison
  (gen_random_uuid(), 'Previous', 'Week1', 'prev1@test.com', '+1111111111', 'qualified', 'interest', 'budget_qualified', 2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Previous', 'Week2', 'prev2@test.com', '+1111111112', 'Demo Scheduled', 'qualified_for_meeting', 'fully_qualified', 5, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', true, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', (SELECT id FROM projects LIMIT 1)),
  (gen_random_uuid(), 'Previous', 'Week3', 'prev3@test.com', '+1111111113', 'unqualified', 'awareness', 'unqualified', 1, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', (SELECT id FROM projects LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- Display final summary
SELECT 
  'Dashboard test data setup complete!' as status,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN bant_status LIKE '%qualified%' THEN 1 END) as qualified_count,
  ROUND(COUNT(CASE WHEN bant_status LIKE '%qualified%' THEN 1 END) * 100.0 / COUNT(*), 1) as qualification_rate_percent,
  COUNT(CASE WHEN requires_human_review = true THEN 1 END) as meeting_pipeline,
  COUNT(CASE WHEN interaction_count > 0 THEN 1 END) as contacted_leads,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_leads
FROM leads; 