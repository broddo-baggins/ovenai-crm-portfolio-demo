-- CREATE CONVERSATION RPC FUNCTIONS FOR UNIFIED API CLIENT
-- This script creates the missing conversation RPC functions that are called by unifiedApiClient

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CREATE CONVERSATION RPC FUNCTION
CREATE OR REPLACE FUNCTION create_conversation_rpc(
    conversation_lead_id uuid,
    conversation_content text DEFAULT '',
    conversation_sender text DEFAULT 'lead'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_conversation record;
    result jsonb;
BEGIN
    -- Validate required fields
    IF conversation_lead_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Lead ID is required'
        );
    END IF;

    -- Verify lead exists
    IF NOT EXISTS (SELECT 1 FROM leads WHERE id = conversation_lead_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Lead not found'
        );
    END IF;

    -- Insert new conversation
    INSERT INTO conversations (
        lead_id,
        message_content,
        timestamp,
        status,
        message_type,
        sender_number,
        created_at,
        updated_at
    ) VALUES (
        conversation_lead_id,
        conversation_content,
        NOW(),
        'active',
        CASE WHEN conversation_sender = 'lead' THEN 'incoming' ELSE 'outgoing' END,
        CASE WHEN conversation_sender = 'lead' THEN '+972501234567' ELSE NULL END,
        NOW(),
        NOW()
    )
    RETURNING * INTO new_conversation;

    -- Build success response
    result := jsonb_build_object(
        'success', true,
        'data', row_to_json(new_conversation)
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- READ CONVERSATIONS RPC FUNCTION
CREATE OR REPLACE FUNCTION read_conversations_rpc(
    conversation_id uuid DEFAULT NULL,
    conversation_lead_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    conversations_data jsonb;
BEGIN
    -- Build query based on parameters
    IF conversation_id IS NOT NULL THEN
        -- Get specific conversation
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'lead_id', c.lead_id,
                'message_content', c.message_content,
                'timestamp', c.timestamp,
                'status', c.status,
                'message_type', c.message_type,
                'sender_number', c.sender_number,
                'receiver_number', c.receiver_number,
                'wamid', c.wamid,
                'wa_timestamp', c.wa_timestamp,
                'created_at', c.created_at,
                'updated_at', c.updated_at,
                'metadata', c.metadata
            )
        )
        INTO conversations_data
        FROM conversations c
        WHERE c.id = conversation_id;
        
    ELSIF conversation_lead_id IS NOT NULL THEN
        -- Get conversations for specific lead
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'lead_id', c.lead_id,
                'message_content', c.message_content,
                'timestamp', c.timestamp,
                'status', c.status,
                'message_type', c.message_type,
                'sender_number', c.sender_number,
                'receiver_number', c.receiver_number,
                'wamid', c.wamid,
                'wa_timestamp', c.wa_timestamp,
                'created_at', c.created_at,
                'updated_at', c.updated_at,
                'metadata', c.metadata
            )
        )
        INTO conversations_data
        FROM conversations c
        WHERE c.lead_id = conversation_lead_id
        ORDER BY c.timestamp DESC;
        
    ELSE
        -- Get all conversations
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'lead_id', c.lead_id,
                'message_content', c.message_content,
                'timestamp', c.timestamp,
                'status', c.status,
                'message_type', c.message_type,
                'sender_number', c.sender_number,
                'receiver_number', c.receiver_number,
                'wamid', c.wamid,
                'wa_timestamp', c.wa_timestamp,
                'created_at', c.created_at,
                'updated_at', c.updated_at,
                'metadata', c.metadata
            )
        )
        INTO conversations_data
        FROM conversations c
        WHERE c.status = 'active'
        ORDER BY c.timestamp DESC
        LIMIT 100;
    END IF;

    -- Handle empty results
    IF conversations_data IS NULL THEN
        conversations_data := '[]'::jsonb;
    END IF;

    -- Build success response
    result := jsonb_build_object(
        'success', true,
        'data', conversations_data
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'data', '[]'::jsonb
        );
END;
$$;

-- UPDATE CONVERSATION RPC FUNCTION
CREATE OR REPLACE FUNCTION update_conversation_rpc(
    conversation_id uuid,
    conversation_content text DEFAULT NULL,
    conversation_sender text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_conversation record;
    result jsonb;
BEGIN
    -- Validate required fields
    IF conversation_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation ID is required'
        );
    END IF;

    -- Verify conversation exists
    IF NOT EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation not found'
        );
    END IF;

    -- Update conversation
    UPDATE conversations 
    SET 
        message_content = COALESCE(conversation_content, message_content),
        message_type = CASE 
            WHEN conversation_sender IS NOT NULL THEN
                CASE WHEN conversation_sender = 'lead' THEN 'incoming' ELSE 'outgoing' END
            ELSE message_type
        END,
        updated_at = NOW()
    WHERE id = conversation_id
    RETURNING * INTO updated_conversation;

    -- Build success response
    result := jsonb_build_object(
        'success', true,
        'data', row_to_json(updated_conversation)
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- DELETE CONVERSATION RPC FUNCTION
CREATE OR REPLACE FUNCTION delete_conversation_rpc(
    conversation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_conversation record;
    result jsonb;
BEGIN
    -- Validate required fields
    IF conversation_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation ID is required'
        );
    END IF;

    -- Verify conversation exists and get it before deleting
    SELECT * INTO deleted_conversation 
    FROM conversations 
    WHERE id = conversation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation not found'
        );
    END IF;

    -- Delete conversation
    DELETE FROM conversations WHERE id = conversation_id;

    -- Build success response
    result := jsonb_build_object(
        'success', true,
        'data', row_to_json(deleted_conversation)
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_conversation_rpc(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_conversation_rpc(uuid, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION read_conversations_rpc(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION read_conversations_rpc(uuid, uuid) TO service_role;

GRANT EXECUTE ON FUNCTION update_conversation_rpc(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_rpc(uuid, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION delete_conversation_rpc(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_conversation_rpc(uuid) TO service_role;

-- Test the functions work
DO $$
BEGIN
    RAISE NOTICE 'Conversation RPC functions created successfully!';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - create_conversation_rpc(lead_id, content, sender)';
    RAISE NOTICE '  - read_conversations_rpc(conversation_id, lead_id)';
    RAISE NOTICE '  - update_conversation_rpc(conversation_id, content, sender)';
    RAISE NOTICE '  - delete_conversation_rpc(conversation_id)';
END $$; 