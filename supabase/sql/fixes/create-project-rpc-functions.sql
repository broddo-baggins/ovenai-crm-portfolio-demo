-- CREATE PROJECT RPC FUNCTIONS FOR CRUD INTEGRATION TESTS
-- This script creates the missing project RPC functions that are called by unifiedApiClient

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CREATE PROJECT RPC FUNCTION
CREATE OR REPLACE FUNCTION create_project_rpc(
    project_name text,
    project_description text DEFAULT NULL,
    project_client_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_project record;
    result jsonb;
BEGIN
    -- Validate required fields
    IF project_name IS NULL OR project_name = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Project name is required'
        );
    END IF;

    -- If client_id is provided, verify it exists
    IF project_client_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM clients WHERE id = project_client_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Client not found'
            );
        END IF;
    ELSE
        -- Get the first available client if none specified
        SELECT id INTO project_client_id FROM clients LIMIT 1;
        
        IF project_client_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'No clients available. Create a client first.'
            );
        END IF;
    END IF;

    -- Insert new project
    INSERT INTO projects (
        name,
        description,
        client_id,
        status,
        metadata
    ) VALUES (
        project_name,
        project_description,
        project_client_id,
        'active',
        '{}'::jsonb
    )
    RETURNING * INTO new_project;

    -- Build success response
    result := jsonb_build_object(
        'id', new_project.id,
        'name', new_project.name,
        'description', new_project.description,
        'client_id', new_project.client_id,
        'status', new_project.status,
        'metadata', new_project.metadata,
        'created_at', new_project.created_at,
        'updated_at', new_project.updated_at
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

-- READ PROJECTS RPC FUNCTION
CREATE OR REPLACE FUNCTION read_projects_rpc(
    project_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    project_data record;
BEGIN
    -- If project_id is provided, get specific project
    IF project_id IS NOT NULL THEN
        SELECT * INTO project_data
        FROM projects
        WHERE id = project_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_array();
        END IF;

        result := jsonb_build_array(
            jsonb_build_object(
                'id', project_data.id,
                'name', project_data.name,
                'description', project_data.description,
                'client_id', project_data.client_id,
                'status', project_data.status,
                'metadata', project_data.metadata,
                'created_at', project_data.created_at,
                'updated_at', project_data.updated_at
            )
        );
    ELSE
        -- Return all projects
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'client_id', p.client_id,
                'status', p.status,
                'metadata', p.metadata,
                'created_at', p.created_at,
                'updated_at', p.updated_at
            )
        ) INTO result
        FROM projects p
        ORDER BY p.created_at DESC;

        -- Handle case where no projects exist
        IF result IS NULL THEN
            result := jsonb_build_array();
        END IF;
    END IF;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- UPDATE PROJECT RPC FUNCTION
CREATE OR REPLACE FUNCTION update_project_rpc(
    project_id uuid,
    project_name text DEFAULT NULL,
    project_description text DEFAULT NULL,
    project_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_project record;
    result jsonb;
BEGIN
    -- Validate project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = project_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Project not found'
        );
    END IF;

    -- Validate status if provided
    IF project_status IS NOT NULL AND project_status NOT IN ('active', 'inactive', 'archived') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be: active, inactive, or archived'
        );
    END IF;

    -- Update project with provided fields
    UPDATE projects SET
        name = COALESCE(project_name, name),
        description = COALESCE(project_description, description),
        status = COALESCE(project_status, status),
        updated_at = now()
    WHERE id = project_id
    RETURNING * INTO updated_project;

    -- Build success response
    result := jsonb_build_object(
        'id', updated_project.id,
        'name', updated_project.name,
        'description', updated_project.description,
        'client_id', updated_project.client_id,
        'status', updated_project.status,
        'metadata', updated_project.metadata,
        'created_at', updated_project.created_at,
        'updated_at', updated_project.updated_at
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

-- DELETE PROJECT RPC FUNCTION
CREATE OR REPLACE FUNCTION delete_project_rpc(
    project_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = project_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Project not found'
        );
    END IF;

    -- Check if project has associated leads
    IF EXISTS (SELECT 1 FROM leads WHERE current_project_id = project_id) THEN
        -- Instead of deleting, set status to archived
        UPDATE projects SET
            status = 'archived',
            updated_at = now()
        WHERE id = project_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Project archived instead of deleted (has associated leads)',
            'action', 'archived'
        );
    ELSE
        -- Safe to delete if no leads associated
        DELETE FROM projects WHERE id = project_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Project deleted successfully',
            'action', 'deleted'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_project_rpc(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION read_projects_rpc(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_project_rpc(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_project_rpc(uuid) TO authenticated;

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION create_project_rpc(text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION read_projects_rpc(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION update_project_rpc(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION delete_project_rpc(uuid) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at); 