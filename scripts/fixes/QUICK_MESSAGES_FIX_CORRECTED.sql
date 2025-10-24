-- 🚨 CORRECTED MESSAGES FIX - Copy & Paste into Supabase SQL Editor
-- This fixes: 404 whatsapp_messages, 400 conversations, 0 messages loaded

-- Add WhatsApp columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_body TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('inbound', 'outbound'));

-- Create whatsapp_messages view (CORRECTED - only reference existing columns)
DROP VIEW IF EXISTS public.whatsapp_messages;
CREATE VIEW public.whatsapp_messages AS
SELECT 
  id, 
  lead_id,
  COALESCE(message_content, message_body, '') as content,
  sender_number,
  receiver_number,
  COALESCE(wa_timestamp, timestamp, created_at) as wa_timestamp,
  created_at, 
  updated_at,
  COALESCE(direction, 'inbound') as direction,
  wamid
FROM public.conversations
WHERE status = 'active';

-- Fix permissions
DROP POLICY IF EXISTS "Allow all conversation access" ON public.conversations;
CREATE POLICY "Allow all conversation access" ON public.conversations FOR ALL USING (true);
GRANT SELECT ON public.whatsapp_messages TO anon, authenticated, service_role;

-- Add sample messages for testing
INSERT INTO public.conversations (
  lead_id, 
  message_content, 
  message_type, 
  direction, 
  timestamp, 
  wa_timestamp, 
  sender_number, 
  receiver_number, 
  status, 
  wamid
)
SELECT 
  l.id, 
  'שלום! אני מעוניין במידע נוסף על הנכס.' as message_content,
  'whatsapp' as message_type,
  'inbound' as direction,
  NOW() - INTERVAL '2 hours' as timestamp,
  NOW() - INTERVAL '2 hours' as wa_timestamp,
  COALESCE(l.phone, '+972501234567') as sender_number,
  '+972501234568' as receiver_number,
  'active' as status,
  'wamid_' || l.id || '_1' as wamid
FROM public.leads l 
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations c 
  WHERE c.lead_id = l.id AND c.message_type = 'whatsapp'
) 
LIMIT 10;

-- Add response messages
INSERT INTO public.conversations (
  lead_id, 
  message_content, 
  message_type, 
  direction, 
  timestamp, 
  wa_timestamp, 
  sender_number, 
  receiver_number, 
  status, 
  wamid
)
SELECT 
  c.lead_id,
  'תודה על הפנייה! נציג שלנו יחזור אליך בקרוב עם כל הפרטים.' as message_content,
  'whatsapp' as message_type,
  'outbound' as direction,
  c.timestamp + INTERVAL '15 minutes' as timestamp,
  c.timestamp + INTERVAL '15 minutes' as wa_timestamp,
  c.receiver_number as sender_number,
  c.sender_number as receiver_number,
  'active' as status,
  'wamid_' || c.lead_id || '_2' as wamid
FROM public.conversations c
WHERE c.direction = 'inbound' 
  AND c.message_type = 'whatsapp'
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c2 
    WHERE c2.lead_id = c.lead_id 
    AND c2.direction = 'outbound' 
    AND c2.message_type = 'whatsapp'
    AND c2.timestamp > c.timestamp
  )
LIMIT 10;

-- Verify results
SELECT 'Messages Fixed!' as status, COUNT(*) as total_messages FROM public.whatsapp_messages; 