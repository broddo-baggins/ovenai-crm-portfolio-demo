-- CRITICAL FIX: Add missing WhatsApp columns to conversations table
-- This fixes the 404 errors for WhatsApp messages in production
-- Execute this in Supabase SQL Editor

-- Add missing WhatsApp columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_wamid ON public.conversations(wamid);
CREATE INDEX IF NOT EXISTS idx_conversations_sender_number ON public.conversations(sender_number);
CREATE INDEX IF NOT EXISTS idx_conversations_wa_timestamp ON public.conversations(wa_timestamp);

-- Update existing conversations with default values if needed
UPDATE public.conversations 
SET 
  sender_number = COALESCE(sender_number, 'unknown'),
  receiver_number = COALESCE(receiver_number, 'unknown'),
  last_message_from = COALESCE(last_message_from, 'system')
WHERE sender_number IS NULL OR receiver_number IS NULL OR last_message_from IS NULL;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
  AND column_name IN ('sender_number', 'receiver_number', 'wamid', 'wa_timestamp', 'last_message_from')
ORDER BY column_name; 