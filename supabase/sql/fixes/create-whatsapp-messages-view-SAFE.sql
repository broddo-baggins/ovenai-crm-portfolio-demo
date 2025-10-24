-- 🚨 CRITICAL FIX: Create whatsapp_messages view for backward compatibility
-- This fixes "relation 'whatsapp_messages' does not exist" errors
-- Execute this in Supabase SQL Editor

-- 1. Add missing WhatsApp columns to conversations table (safe operation)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_body TEXT,
ADD COLUMN IF NOT EXISTS awaits_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS from_phone TEXT,
ADD COLUMN IF NOT EXISTS to_phone TEXT;

-- 2. Create indexes for performance (safe operation)
CREATE INDEX IF NOT EXISTS idx_conversations_sender_number ON public.conversations(sender_number);
CREATE INDEX IF NOT EXISTS idx_conversations_receiver_number ON public.conversations(receiver_number);
CREATE INDEX IF NOT EXISTS idx_conversations_wamid ON public.conversations(wamid);
CREATE INDEX IF NOT EXISTS idx_conversations_wa_timestamp ON public.conversations(wa_timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_from_phone ON public.conversations(from_phone);

-- 3. Create WhatsApp messages view for backward compatibility
CREATE OR REPLACE VIEW public.whatsapp_messages AS
SELECT 
  id,
  lead_id,
  COALESCE(message_content, content) as content,
  message_body,
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

-- 4. Grant access to the view
GRANT SELECT ON public.whatsapp_messages TO anon, authenticated, service_role;

-- 5. Update RLS policy for conversations (safe operation)
DROP POLICY IF EXISTS "Allow WhatsApp message access" ON public.conversations;
CREATE POLICY "Allow WhatsApp message access" ON public.conversations
  FOR ALL USING (
    -- Allow if user has access to the lead's project
    EXISTS (
      SELECT 1 
      FROM public.leads l
      JOIN public.projects p ON p.id = l.current_project_id
      JOIN public.client_members cm ON cm.client_id = p.client_id
      WHERE l.id = conversations.lead_id 
        AND cm.user_id = auth.uid()
    )
    OR
    -- Allow service role full access
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 6. Grant comprehensive permissions
GRANT ALL ON public.conversations TO anon, authenticated, service_role;

-- 7. Verify the fix worked
SELECT 
  'conversations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sender_number IS NOT NULL THEN 1 END) as whatsapp_records
FROM public.conversations
UNION ALL
SELECT 
  'whatsapp_messages_view' as table_name,
  COUNT(*) as total_records,
  COUNT(*) as whatsapp_records
FROM public.whatsapp_messages;

-- Success message
SELECT '✅ WhatsApp messages view created successfully! Your 404 errors should now be fixed.' as status; 