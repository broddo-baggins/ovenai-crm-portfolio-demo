-- Create whatsapp_messages table (replicated from master database structure)
-- Run this SQL in your Supabase SQL Editor

-- Drop table if it exists (optional - for clean slate)
-- DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;

-- Create whatsapp_messages table matching master structure
-- Note: Adjusted to match actual master structure found during analysis
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_number VARCHAR(50),
  content TEXT,
  wamid VARCHAR(255) UNIQUE,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awaits_response BOOLEAN DEFAULT false,
  receiver_id VARCHAR(255),
  receiver_number VARCHAR(50),
  wa_timestamp TIMESTAMP WITH TIME ZONE,
  test_mode BOOLEAN DEFAULT false,
  test_session_id VARCHAR(255),
  test_scenario_name VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_number ON public.whatsapp_messages(sender_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wamid ON public.whatsapp_messages(wamid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_receiver_id ON public.whatsapp_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_receiver_number ON public.whatsapp_messages(receiver_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_timestamp ON public.whatsapp_messages(wa_timestamp);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for full access (development)
DROP POLICY IF EXISTS "Allow all operations on whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Allow all operations on whatsapp_messages" ON public.whatsapp_messages
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO anon; 