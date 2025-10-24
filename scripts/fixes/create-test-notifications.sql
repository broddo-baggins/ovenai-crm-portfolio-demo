-- Create test notifications for test@test.test user
-- This demonstrates the notification system is working

-- Get the test user ID
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Find the test@test.test user
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@test.test'
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'test@test.test user not found. Using first available user.';
        SELECT id INTO test_user_id 
        FROM auth.users 
        LIMIT 1;
    END IF;
    
    IF test_user_id IS NOT NULL THEN
        -- Clear existing test notifications
        DELETE FROM public.notifications 
        WHERE user_id = test_user_id 
        AND metadata->>'category' IN ('test', 'demo', 'sample');
        
        -- Insert fresh test notifications
        INSERT INTO public.notifications (user_id, title, message, type, read, action_url, metadata) VALUES
        
        -- Lead activity notifications
        (test_user_id, 
         'New Lead Created', 
         'John Smith has been added to your pipeline. Phone: +1234567890', 
         'lead', 
         false, 
         '/leads?highlight=new', 
         '{"category": "lead_activity", "priority": "medium", "lead_name": "John Smith", "source": "website"}'::jsonb),
         
        (test_user_id, 
         'Lead Status Updated', 
         'Sarah Johnson moved from Cold to Hot prospect!', 
         'lead', 
         false, 
         '/leads?filter=hot', 
         '{"category": "lead_activity", "priority": "high", "lead_name": "Sarah Johnson", "status_change": "cold_to_hot"}'::jsonb),
         
        -- Message notifications
        (test_user_id, 
         'New WhatsApp Message', 
         'Message received from +1987654321: "Hi, I am interested in your services"', 
         'message', 
         false, 
         '/messages?phone=1987654321', 
         '{"category": "whatsapp_activity", "priority": "high", "phone": "+1987654321", "preview": "Hi, I am interested in your services"}'::jsonb),
         
        (test_user_id, 
         'Message Delivery Confirmed', 
         'Your message to Alex Turner was delivered successfully', 
         'message', 
         true, 
         '/messages?phone=1555123456', 
         '{"category": "whatsapp_activity", "priority": "low", "phone": "+1555123456", "status": "delivered"}'::jsonb),
         
        -- Meeting notifications
        (test_user_id, 
         'Meeting Scheduled! 🔥', 
         'Emily Davis scheduled a BANT qualification call for tomorrow at 2:00 PM', 
         'meeting', 
         false, 
         '/calendar?highlight=tomorrow', 
         '{"category": "calendly_meeting", "priority": "high", "contact_name": "Emily Davis", "meeting_type": "bant_qualification", "scheduled_for": "tomorrow_2pm"}'::jsonb),
         
        -- System notifications
        (test_user_id, 
         'Performance Update', 
         'Great work! You have achieved 85% of your monthly lead target', 
         'success', 
         false, 
         '/dashboard?tab=performance', 
         '{"category": "performance", "priority": "medium", "achievement": "85%", "target": "monthly_leads"}'::jsonb),
         
        (test_user_id, 
         'Integration Status', 
         'WhatsApp Business API is connected and working properly', 
         'system', 
         true, 
         '/settings?tab=integrations', 
         '{"category": "system_status", "priority": "low", "integration": "whatsapp", "status": "connected"}'::jsonb),
         
        -- Welcome notification
        (test_user_id, 
         'Welcome to OvenAI! 🎉', 
         'Your notification system is now active. You will receive real-time updates about leads, messages, and system events.', 
         'success', 
         false, 
         '/dashboard', 
         '{"category": "onboarding", "priority": "high", "welcome": true}'::jsonb);
        
        RAISE NOTICE 'Created % test notifications for user %', 8, test_user_id;
        
        -- Show notification summary
        RAISE NOTICE 'Notification Summary:';
        RAISE NOTICE '  Total: %', (SELECT COUNT(*) FROM public.notifications WHERE user_id = test_user_id);
        RAISE NOTICE '  Unread: %', (SELECT COUNT(*) FROM public.notifications WHERE user_id = test_user_id AND read = false);
        RAISE NOTICE '  Types: %', (SELECT string_agg(DISTINCT type, ', ') FROM public.notifications WHERE user_id = test_user_id);
        
    ELSE
        RAISE NOTICE 'No users found in the system.';
    END IF;
END $$; 