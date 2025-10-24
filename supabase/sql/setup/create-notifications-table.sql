-- Create notifications table for OvenAI
-- Run this in the Supabase SQL Editor

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS public.notifications;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID DEFAULT NULL, -- Optional reference to clients table
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'lead', 'message', 'system', 'meeting')),
    read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample notifications for the first user
INSERT INTO public.notifications (user_id, title, message, type, metadata)
SELECT 
    u.id,
    'Welcome to OvenAI!',
    'Your notification system is now active. You''ll receive updates about leads, messages, and system events.',
    'success',
    '{"category": "onboarding", "priority": "high"}'::jsonb
FROM auth.users u
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
SELECT 
    u.id,
    'New Lead Available',
    'A potential lead has been identified from your recent activity.',
    'lead',
    '/leads',
    '{"source": "system", "campaign": "auto_detection"}'::jsonb
FROM auth.users u
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (user_id, title, message, type, metadata)
SELECT 
    u.id,
    'System Update',
    'OvenAI has been updated with new features including real-time notifications.',
    'system',
    '{"version": "2.1.0", "features": ["notifications", "rtl_support", "mobile_optimization"]}'::jsonb
FROM auth.users u
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 
    COUNT(*) as notification_count,
    COUNT(CASE WHEN read = false THEN 1 END) as unread_count
FROM public.notifications;

-- Show sample notifications
SELECT 
    title,
    type,
    read,
    created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 5; 