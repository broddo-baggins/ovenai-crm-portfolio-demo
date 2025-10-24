-- 🚨 CRITICAL FIX: Messages API Connectivity Issues
-- This script fixes 406 (Not Acceptable), 400 (Bad Request), and 404 (Not Found) errors
-- by adding missing WhatsApp columns to conversations table and creating proper RLS policies

-- Add missing WhatsApp-specific columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS awaits_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS from_phone TEXT,
ADD COLUMN IF NOT EXISTS to_phone TEXT,
ADD COLUMN IF NOT EXISTS last_message_from TEXT;

-- Create indexes for performance on WhatsApp-related queries
CREATE INDEX IF NOT EXISTS idx_conversations_sender_number ON public.conversations(sender_number);
CREATE INDEX IF NOT EXISTS idx_conversations_receiver_number ON public.conversations(receiver_number);
CREATE INDEX IF NOT EXISTS idx_conversations_wamid ON public.conversations(wamid);
CREATE INDEX IF NOT EXISTS idx_conversations_wa_timestamp ON public.conversations(wa_timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_from_phone ON public.conversations(from_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_to_phone ON public.conversations(to_phone);

-- Create a view for backward compatibility with old whatsapp_messages queries
CREATE OR REPLACE VIEW public.whatsapp_messages AS
SELECT 
  id,
  lead_id,
  COALESCE(message_content, '') as content,
  sender_number,
  receiver_number,
  from_phone,
  to_phone,
  wamid,
  wa_timestamp,
  created_at,
  updated_at,
  payload,
  COALESCE(message_type, 'whatsapp') as message_type,
  awaits_response
FROM public.conversations 
WHERE 
  message_type = 'whatsapp' 
  OR sender_number IS NOT NULL 
  OR receiver_number IS NOT NULL 
  OR wamid IS NOT NULL
  OR from_phone IS NOT NULL
  OR to_phone IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.whatsapp_messages TO anon, authenticated, service_role;

-- Update RLS policy for conversations to handle WhatsApp data access
DROP POLICY IF EXISTS "Enhanced conversations access" ON public.conversations;
CREATE POLICY "Enhanced conversations access" ON public.conversations
  FOR ALL USING (
    auth.uid() IN (
      SELECT cm.user_id 
      FROM client_members cm
      JOIN projects p ON p.client_id = cm.client_id
      JOIN leads l ON l.current_project_id = p.id
      WHERE l.id = conversations.lead_id
    )
    OR 
    -- Allow access if user has direct access to the lead's project
    auth.uid() IN (
      SELECT pm.user_id
      FROM project_members pm
      JOIN leads l ON l.current_project_id = pm.project_id
      WHERE l.id = conversations.lead_id
    )
  );

-- Add proper error handling for missing columns
-- This prevents 42703 errors when columns don't exist
DO $$
BEGIN
  -- Test if all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'sender_number'
  ) THEN
    RAISE NOTICE 'Adding missing sender_number column to conversations';
    ALTER TABLE public.conversations ADD COLUMN sender_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'receiver_number'
  ) THEN
    RAISE NOTICE 'Adding missing receiver_number column to conversations';
    ALTER TABLE public.conversations ADD COLUMN receiver_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'wamid'
  ) THEN
    RAISE NOTICE 'Adding missing wamid column to conversations';
    ALTER TABLE public.conversations ADD COLUMN wamid TEXT;
  END IF;

  RAISE NOTICE 'Conversations table schema update completed successfully';
END $$;

-- Grant necessary permissions
GRANT ALL ON public.conversations TO anon, authenticated, service_role;

-- Verify the fix
SELECT 
  'conversations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sender_number IS NOT NULL THEN 1 END) as whatsapp_records,
  'Schema ready for Messages API' as status
FROM public.conversations;

COMMENT ON TABLE public.conversations IS 'Updated to support WhatsApp messages and fix Messages API 406/400/404 errors'; 