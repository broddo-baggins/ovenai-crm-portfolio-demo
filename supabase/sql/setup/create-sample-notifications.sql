-- Create sample notifications for testing
-- Run this in the Supabase SQL Editor

-- First, get the current user ID
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Insert sample notifications
    INSERT INTO public.notifications (user_id, client_id, title, message, type, read, action_url, metadata) VALUES
    (
        current_user_id,
        '53a6cb3d-e173-49b0-a501-a73699ec5f86',
        'Welcome to OvenAI Real Notifications!',
        'Your notification system is now connected to the database and working properly.',
        'success',
        false,
        '/dashboard',
        '{"category": "system", "priority": "high"}'::jsonb
    ),
    (
        current_user_id,
        '53a6cb3d-e173-49b0-a501-a73699ec5f86',
        'New Lead Alert',
        'A potential lead has been identified from your recent marketing campaign.',
        'lead',
        false,
        '/leads',
        '{"source": "marketing", "campaign": "q1_2025"}'::jsonb
    ),
    (
        current_user_id,
        '53a6cb3d-e173-49b0-a501-a73699ec5f86',
        'Message Response Received',
        'You have received a new response from a lead. Click to view the conversation.',
        'message',
        false,
        '/messages',
        '{"conversation_id": "conv_123", "lead_name": "John Doe"}'::jsonb
    ),
    (
        current_user_id,
        '53a6cb3d-e173-49b0-a501-a73699ec5f86',
        'System Performance Update',
        'Your system is running optimally. All integrations are functioning correctly.',
        'system',
        true,
        '/settings',
        '{"performance_score": 95, "uptime": "99.9%"}'::jsonb
    ),
    (
        current_user_id,
        '53a6cb3d-e173-49b0-a501-a73699ec5f86',
        'Weekly Report Ready',
        'Your weekly performance report is now available for review.',
        'info',
        false,
        '/reports',
        '{"report_type": "weekly", "period": "2025-01-20_to_2025-01-26"}'::jsonb
    );
    
    RAISE NOTICE 'Sample notifications created successfully for user: %', current_user_id;
END $$; 