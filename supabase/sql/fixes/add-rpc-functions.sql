-- ADD MISSING RPC FUNCTIONS FOR CRUD INTEGRATION TESTS
-- This script adds the missing net.http_post and related functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "http";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the net schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS net;

-- Create the http_post function
CREATE OR REPLACE FUNCTION net.http_post(
    url text,
    headers text DEFAULT NULL,
    body text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    http_response record;
BEGIN
    -- Validate URL
    IF url IS NULL OR url = '' THEN
        RETURN json_build_object(
            'status', 400,
            'error', 'URL cannot be empty'
        );
    END IF;

    -- Use the http extension to make the request
    SELECT INTO http_response *
    FROM http((
        'POST',
        url,
        ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('User-Agent', 'Supabase-RPC/1.0')
        ] || CASE 
            WHEN headers IS NOT NULL THEN 
                string_to_array(headers, ',')::http_header[]
            ELSE 
                ARRAY[]::http_header[]
        END,
        COALESCE(body, '{}'),
        NULL
    )::http_request);

    -- Build response
    result := json_build_object(
        'status', http_response.status,
        'headers', http_response.headers,
        'content', http_response.content
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 500,
            'error', SQLERRM
        );
END;
$$;

-- Create the http_get function
CREATE OR REPLACE FUNCTION net.http_get(
    url text,
    headers text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    http_response record;
BEGIN
    -- Validate URL
    IF url IS NULL OR url = '' THEN
        RETURN json_build_object(
            'status', 400,
            'error', 'URL cannot be empty'
        );
    END IF;

    -- Use the http extension to make the request
    SELECT INTO http_response *
    FROM http((
        'GET',
        url,
        ARRAY[
            http_header('User-Agent', 'Supabase-RPC/1.0')
        ] || CASE 
            WHEN headers IS NOT NULL THEN 
                string_to_array(headers, ',')::http_header[]
            ELSE 
                ARRAY[]::http_header[]
        END,
        NULL,
        NULL
    )::http_request);

    -- Build response
    result := json_build_object(
        'status', http_response.status,
        'headers', http_response.headers,
        'content', http_response.content
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 500,
            'error', SQLERRM
        );
END;
$$;

-- Create sync functions for CRUD operations
CREATE OR REPLACE FUNCTION sync_lead_to_external(
    lead_id uuid,
    action text DEFAULT 'create'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_data record;
    sync_result json;
BEGIN
    -- Get lead data
    SELECT * INTO lead_data
    FROM leads
    WHERE id = lead_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lead not found'
        );
    END IF;

    -- Mock external sync (replace with actual API call)
    sync_result := json_build_object(
        'success', true,
        'action', action,
        'lead_id', lead_id,
        'external_id', gen_random_uuid(),
        'synced_at', now()
    );

    -- Log sync operation
    INSERT INTO sync_logs (
        entity_type,
        entity_id,
        action,
        result,
        created_at
    ) VALUES (
        'lead',
        lead_id,
        action,
        sync_result,
        now()
    )
    ON CONFLICT DO NOTHING;

    RETURN sync_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Create sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    result json,
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs (created_at);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO authenticated;
GRANT ALL ON sync_logs TO authenticated;

-- Create RLS policies for sync_logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs" ON sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM client_members cm
            WHERE cm.user_id = auth.uid()
            AND cm.permissions ? 'read'
        )
    );

CREATE POLICY "Users can insert sync logs" ON sync_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM client_members cm
            WHERE cm.user_id = auth.uid()
            AND cm.permissions ? 'write'
        )
    );

SELECT 'RPC functions and sync infrastructure created successfully' as result; 