-- 🔧 POPULATE TEST MESSAGES FROM CONVERSATIONS
-- This script creates individual message records from existing conversation threads
-- Each conversation will be expanded into 2-5 individual messages

-- First, let's check what we're working with
SELECT 'CURRENT STATUS:' as section;
SELECT COUNT(*) as total_conversations FROM conversations WHERE message_content IS NOT NULL;

-- Create a temporary messages table if needed
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    lead_id UUID REFERENCES leads(id),
    content TEXT NOT NULL,
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) DEFAULT 'text',
    sender_number TEXT,
    receiver_number TEXT,
    wa_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate messages from conversations
WITH conversation_messages AS (
    -- First message (always inbound from lead)
    SELECT 
        gen_random_uuid() as id,
        c.id as conversation_id,
        c.lead_id,
        'Hello, I am interested in your services.' as content,
        'inbound' as direction,
        'text' as message_type,
        c.created_at as wa_timestamp,
        1 as sequence
    FROM conversations c
    WHERE c.message_content IS NOT NULL
    
    UNION ALL
    
    -- Second message (outbound response)
    SELECT 
        gen_random_uuid() as id,
        c.id as conversation_id,
        c.lead_id,
        'Thank you for your interest! How can I help you today?' as content,
        'outbound' as direction,
        'text' as message_type,
        c.created_at + INTERVAL '5 minutes' as wa_timestamp,
        2 as sequence
    FROM conversations c
    WHERE c.message_content IS NOT NULL
    
    UNION ALL
    
    -- Third message (inbound follow-up)
    SELECT 
        gen_random_uuid() as id,
        c.id as conversation_id,
        c.lead_id,
        'I would like to know more about pricing and features.' as content,
        'inbound' as direction,
        'text' as message_type,
        c.created_at + INTERVAL '10 minutes' as wa_timestamp,
        3 as sequence
    FROM conversations c
    WHERE c.message_content IS NOT NULL
    AND c.message_type IN ('incoming', 'outgoing') -- Only for conversations with activity
    
    UNION ALL
    
    -- Fourth message (outbound with actual content)
    SELECT 
        gen_random_uuid() as id,
        c.id as conversation_id,
        c.lead_id,
        c.message_content as content, -- Use actual conversation content
        'outbound' as direction,
        'text' as message_type,
        c.created_at + INTERVAL '15 minutes' as wa_timestamp,
        4 as sequence
    FROM conversations c
    WHERE c.message_content IS NOT NULL
    
    UNION ALL
    
    -- Fifth message (recent activity)
    SELECT 
        gen_random_uuid() as id,
        c.id as conversation_id,
        c.lead_id,
        'Is there anything else you need help with?' as content,
        CASE WHEN c.message_type = 'incoming' THEN 'inbound' ELSE 'outbound' END as direction,
        'text' as message_type,
        COALESCE(c.updated_at, c.created_at + INTERVAL '20 minutes') as wa_timestamp,
        5 as sequence
    FROM conversations c
    WHERE c.message_content IS NOT NULL
    AND c.updated_at > c.created_at + INTERVAL '1 hour' -- Only for longer conversations
)
INSERT INTO messages (id, conversation_id, lead_id, content, direction, message_type, wa_timestamp, created_at)
SELECT 
    id,
    conversation_id,
    lead_id,
    content,
    direction,
    message_type,
    wa_timestamp,
    wa_timestamp as created_at
FROM conversation_messages
ON CONFLICT (id) DO NOTHING;

-- Update the whatsapp_messages view to include individual messages
CREATE OR REPLACE VIEW whatsapp_messages AS
SELECT 
    m.id,
    m.lead_id,
    m.content,
    m.sender_number,
    m.receiver_number,
    NULL as from_phone,
    NULL as to_phone,
    m.conversation_id as wamid,
    m.wa_timestamp,
    m.created_at,
    m.updated_at,
    '{}' as payload,
    m.message_type,
    false as awaits_response,
    m.direction
FROM messages m

UNION ALL

-- Keep existing conversation-based records for backward compatibility
SELECT 
    id,
    lead_id,
    COALESCE(message_content, '') as content,
    sender_number,
    receiver_number,
    NULL as from_phone,
    NULL as to_phone,
    wamid,
    wa_timestamp,
    created_at,
    updated_at,
    COALESCE(payload, '{}') as payload,
    COALESCE(message_type, 'text') as message_type,
    false as awaits_response,
    COALESCE(direction, CASE WHEN message_type = 'incoming' THEN 'inbound' ELSE 'outbound' END) as direction
FROM conversations 
WHERE message_type IN ('whatsapp', 'incoming', 'outgoing') 
   OR sender_number IS NOT NULL 
   OR receiver_number IS NOT NULL;

-- Grant permissions
GRANT ALL ON messages TO authenticated, anon, service_role;

-- Check results
SELECT 'RESULTS:' as section;
SELECT COUNT(*) as total_messages_created FROM messages;
SELECT COUNT(DISTINCT conversation_id) as conversations_with_messages FROM messages;
SELECT COUNT(DISTINCT lead_id) as leads_with_messages FROM messages;

-- Sample check
SELECT 'SAMPLE MESSAGES:' as section;
SELECT 
    m.direction,
    m.content,
    m.wa_timestamp,
    l.first_name || ' ' || l.last_name as lead_name
FROM messages m
JOIN leads l ON l.id = m.lead_id
ORDER BY m.wa_timestamp DESC
LIMIT 10; 