-- Fix WhatsApp Messages 404 Errors
-- WhatsApp messages should be stored in conversations table, not separate whatsapp_messages table
-- This script ensures proper data structure and fixes 404 errors

-- 1. Ensure conversations table has all required WhatsApp columns
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_body TEXT,
ADD COLUMN IF NOT EXISTS awaits_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS from_phone TEXT,
ADD COLUMN IF NOT EXISTS to_phone TEXT;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_sender_number ON public.conversations(sender_number);
CREATE INDEX IF NOT EXISTS idx_conversations_receiver_number ON public.conversations(receiver_number);
CREATE INDEX IF NOT EXISTS idx_conversations_wamid ON public.conversations(wamid);
CREATE INDEX IF NOT EXISTS idx_conversations_wa_timestamp ON public.conversations(wa_timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_from_phone ON public.conversations(from_phone);

-- 3. Migrate any existing whatsapp_messages data to conversations table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
        -- Insert WhatsApp messages as conversations
        INSERT INTO public.conversations (
            id,
            lead_id,
            content,
            message_content,
            message_body,
            sender_number,
            receiver_number,
            from_phone,
            to_phone,
            wamid,
            wa_timestamp,
            created_at,
            updated_at,
            message_type,
            payload
        )
        SELECT 
            wm.id,
            wm.lead_id,
            wm.content,
            wm.content as message_content,
            wm.message_body,
            wm.sender_number,
            wm.receiver_number,
            wm.from_phone,
            wm.to_phone,
            wm.wamid,
            wm.wa_timestamp,
            wm.created_at,
            wm.updated_at,
            'whatsapp' as message_type,
            COALESCE(wm.payload, '{}'::jsonb)
        FROM whatsapp_messages wm
        WHERE NOT EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.wamid = wm.wamid AND wm.wamid IS NOT NULL
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Migrated WhatsApp messages to conversations table';
    END IF;
END $$;

-- 4. Update RLS policies for conversations to handle WhatsApp data
DROP POLICY IF EXISTS "Allow WhatsApp message access" ON public.conversations;
CREATE POLICY "Allow WhatsApp message access" ON public.conversations
  FOR ALL USING (
    auth.uid() IN (
      SELECT cm.user_id 
      FROM client_members cm
      JOIN projects p ON p.client_id = cm.client_id
      JOIN leads l ON l.current_project_id = p.id
      WHERE l.id = conversations.lead_id
    )
  );

-- 5. Grant necessary permissions
GRANT ALL ON public.conversations TO anon, authenticated, service_role;

-- 6. Create a view for WhatsApp messages (for backward compatibility)
CREATE OR REPLACE VIEW whatsapp_messages AS
SELECT 
  id,
  lead_id,
  content,
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
  message_type
FROM conversations 
WHERE message_type = 'whatsapp' 
   OR sender_number IS NOT NULL 
   OR receiver_number IS NOT NULL 
   OR wamid IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON whatsapp_messages TO anon, authenticated, service_role;

-- 7. Verify the fix
SELECT 
  'conversations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sender_number IS NOT NULL THEN 1 END) as whatsapp_records
FROM conversations
UNION ALL
SELECT 
  'whatsapp_messages_view' as table_name,
  COUNT(*) as total_records,
  COUNT(*) as whatsapp_records
FROM whatsapp_messages;

COMMIT; 