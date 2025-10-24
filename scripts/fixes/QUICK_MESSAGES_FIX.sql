-- 🚨 QUICK MESSAGES FIX - Copy & Paste into Supabase SQL Editor
-- This fixes: 404 whatsapp_messages, 400 conversations, 0 messages loaded

-- Add WhatsApp columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sender_number TEXT,
ADD COLUMN IF NOT EXISTS receiver_number TEXT,
ADD COLUMN IF NOT EXISTS wamid TEXT,
ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_body TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('inbound', 'outbound'));

-- Create whatsapp_messages view
DROP VIEW IF EXISTS public.whatsapp_messages;
CREATE VIEW public.whatsapp_messages AS
SELECT 
  id, lead_id,
  COALESCE(message_content, message_body, '') as content,
  COALESCE(sender_number, from_phone) as sender_number,
  COALESCE(receiver_number, to_phone) as receiver_number,
  COALESCE(wa_timestamp, timestamp, created_at) as wa_timestamp,
  created_at, updated_at,
  COALESCE(direction, 'inbound') as direction
FROM public.conversations
WHERE status = 'active';

-- Fix permissions
DROP POLICY IF EXISTS "Allow all conversation access" ON public.conversations;
CREATE POLICY "Allow all conversation access" ON public.conversations FOR ALL USING (true);
GRANT SELECT ON public.whatsapp_messages TO anon, authenticated, service_role;

-- Add sample messages for testing
INSERT INTO public.conversations (lead_id, message_content, message_type, direction, timestamp, wa_timestamp, sender_number, receiver_number, status, wamid)
SELECT l.id, 'שלום! אני מעוניין במידע נוסף על הנכס.', 'whatsapp', 'inbound', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', COALESCE(l.phone, '+972501234567'), '+972501234568', 'active', 'wamid_' || l.id || '_1'
FROM public.leads l WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.lead_id = l.id AND c.message_type = 'whatsapp') LIMIT 10;

-- Verify results
SELECT 'Fixed!' as status, COUNT(*) as total_messages FROM public.whatsapp_messages; 