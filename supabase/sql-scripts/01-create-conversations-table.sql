-- Create conversations table (replicated from master database structure)
-- Run this SQL in your Supabase SQL Editor

-- Drop table if it exists (optional - for clean slate)
-- DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create conversations table matching master structure
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  message_content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  message_id VARCHAR(255),
  message_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validation_context JSONB,
  conversation_context JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON public.conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_message_type ON public.conversations(message_type);
CREATE INDEX IF NOT EXISTS idx_conversations_message_id ON public.conversations(message_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for full access (development)
DROP POLICY IF EXISTS "Allow all operations on conversations" ON public.conversations;
CREATE POLICY "Allow all operations on conversations" ON public.conversations
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO anon; 