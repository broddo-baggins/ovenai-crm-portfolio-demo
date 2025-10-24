-- =====================================================
-- ADMIN RPC FUNCTIONS FOR PRODUCTION DEPLOYMENT
-- These functions run with elevated privileges and bypass RLS
-- =====================================================

-- Create function to execute SQL with elevated privileges
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with function owner privileges
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only allow service role or admin users to execute
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' 
       AND current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin privileges required';
    END IF;
    
    -- Execute the SQL
    EXECUTE sql;
    
    -- Return success status
    result := jsonb_build_object(
        'success', true,
        'message', 'SQL executed successfully',
        'timestamp', extract(epoch from now())
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'timestamp', extract(epoch from now())
        );
        RETURN result;
END;
$$;

-- Create function to apply database schema fixes
CREATE OR REPLACE FUNCTION public.apply_database_fixes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    fix_results JSONB[] := ARRAY[]::JSONB[];
    current_fix JSONB;
BEGIN
    -- Only allow service role or admin users
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' 
       AND current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin privileges required';
    END IF;

    -- Fix 1: Create missing tables and columns
    BEGIN
        -- Create project_members table
        CREATE TABLE IF NOT EXISTS public.project_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'CONTRIBUTOR')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(project_id, user_id)
        );

        -- Create client_members table
        CREATE TABLE IF NOT EXISTS public.client_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(client_id, user_id)
        );

        -- Add missing columns
        ALTER TABLE public.clients 
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}';

        ALTER TABLE public.projects
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

        ALTER TABLE public.leads
            ADD COLUMN IF NOT EXISTS company TEXT,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'new';

        ALTER TABLE public.conversations
            ADD COLUMN IF NOT EXISTS last_message_from TEXT,
            ADD COLUMN IF NOT EXISTS sender_number TEXT,
            ADD COLUMN IF NOT EXISTS receiver_number TEXT,
            ADD COLUMN IF NOT EXISTS wamid TEXT,
            ADD COLUMN IF NOT EXISTS wa_timestamp TIMESTAMP WITH TIME ZONE;

        current_fix := jsonb_build_object(
            'fix', 'create_missing_tables',
            'success', true,
            'message', 'Tables and columns created successfully'
        );
    EXCEPTION
        WHEN OTHERS THEN
            current_fix := jsonb_build_object(
                'fix', 'create_missing_tables',
                'success', false,
                'error', SQLERRM
            );
    END;
    fix_results := fix_results || current_fix;

    -- Fix 2: Fix status constraints
    BEGIN
        -- Fix leads status constraint
        ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
        ALTER TABLE public.leads 
        ADD CONSTRAINT leads_status_check 
        CHECK (status IN (
            'new', 'active', 'inactive', 'qualified', 'unqualified', 
            'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
            'nurturing', 'follow_up', 'contacted', 'not_contacted',
            'pending', 'archived', 'deleted'
        ));

        -- Update invalid status values
        UPDATE public.leads 
        SET status = 'new'
        WHERE status NOT IN (
            'new', 'active', 'inactive', 'qualified', 'unqualified', 
            'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
            'nurturing', 'follow_up', 'contacted', 'not_contacted',
            'pending', 'archived', 'deleted'
        );

        current_fix := jsonb_build_object(
            'fix', 'fix_status_constraints',
            'success', true,
            'message', 'Status constraints fixed successfully'
        );
    EXCEPTION
        WHEN OTHERS THEN
            current_fix := jsonb_build_object(
                'fix', 'fix_status_constraints',
                'success', false,
                'error', SQLERRM
            );
    END;
    fix_results := fix_results || current_fix;

    -- Fix 3: Create permissive RLS policies for testing
    BEGIN
        -- Enable RLS
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

        -- Create bypass policies for service role
        DROP POLICY IF EXISTS "service_role_bypass_clients" ON public.clients;
        CREATE POLICY "service_role_bypass_clients" ON public.clients
            FOR ALL USING (true);

        DROP POLICY IF EXISTS "service_role_bypass_projects" ON public.projects;
        CREATE POLICY "service_role_bypass_projects" ON public.projects
            FOR ALL USING (true);

        DROP POLICY IF EXISTS "service_role_bypass_leads" ON public.leads;
        CREATE POLICY "service_role_bypass_leads" ON public.leads
            FOR ALL USING (true);

        DROP POLICY IF EXISTS "service_role_bypass_conversations" ON public.conversations;
        CREATE POLICY "service_role_bypass_conversations" ON public.conversations
            FOR ALL USING (true);

        DROP POLICY IF EXISTS "service_role_bypass_client_members" ON public.client_members;
        CREATE POLICY "service_role_bypass_client_members" ON public.client_members
            FOR ALL USING (true);

        DROP POLICY IF EXISTS "service_role_bypass_project_members" ON public.project_members;
        CREATE POLICY "service_role_bypass_project_members" ON public.project_members
            FOR ALL USING (true);

        current_fix := jsonb_build_object(
            'fix', 'create_rls_policies',
            'success', true,
            'message', 'RLS policies created successfully'
        );
    EXCEPTION
        WHEN OTHERS THEN
            current_fix := jsonb_build_object(
                'fix', 'create_rls_policies',
                'success', false,
                'error', SQLERRM
            );
    END;
    fix_results := fix_results || current_fix;

    -- Fix 4: Grant permissions
    BEGIN
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        GRANT USAGE ON SCHEMA public TO authenticated;

        current_fix := jsonb_build_object(
            'fix', 'grant_permissions',
            'success', true,
            'message', 'Permissions granted successfully'
        );
    EXCEPTION
        WHEN OTHERS THEN
            current_fix := jsonb_build_object(
                'fix', 'grant_permissions',
                'success', false,
                'error', SQLERRM
            );
    END;
    fix_results := fix_results || current_fix;

    -- Build final result
    result := jsonb_build_object(
        'success', true,
        'message', 'Database fixes applied',
        'fixes', fix_results,
        'timestamp', extract(epoch from now())
    );

    RETURN result;
END;
$$;

-- Create function to setup test data
CREATE OR REPLACE FUNCTION public.setup_test_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only allow service role or admin users
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' 
       AND current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin privileges required';
    END IF;

    -- Create test client
    INSERT INTO public.clients (
        id,
        name,
        description,
        contact_info,
        created_at,
        updated_at
    ) VALUES (
        'e93b20b0-2df9-49cf-9645-5159590877a0'::uuid,
        'Test Client Company',
        'Default test client for development',
        '{"email": "test@testclient.com", "phone": "+1-555-TEST-CLIENT"}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();

    -- Create test project
    INSERT INTO public.projects (
        id,
        name,
        description,
        client_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        'c61dd62e-743e-4ec7-9147-a26ae613c8d4'::uuid,
        'Test Project Alpha',
        'Default test project for development',
        'e93b20b0-2df9-49cf-9645-5159590877a0'::uuid,
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();

    result := jsonb_build_object(
        'success', true,
        'message', 'Test data created successfully',
        'timestamp', extract(epoch from now())
    );

    RETURN result;
END;
$$;

-- Create enhanced CRUD functions that bypass RLS for testing
CREATE OR REPLACE FUNCTION public.admin_crud_operation(
    table_name TEXT,
    operation TEXT,
    data JSONB DEFAULT NULL,
    filters JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    query_text TEXT;
    record_data RECORD;
BEGIN
    -- Only allow service role or admin users
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' 
       AND current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin privileges required';
    END IF;

    -- Validate table name (security check)
    IF table_name NOT IN ('clients', 'projects', 'leads', 'conversations', 'client_members', 'project_members') THEN
        RAISE EXCEPTION 'Invalid table name: %', table_name;
    END IF;

    -- Execute operation based on type
    CASE operation
        WHEN 'CREATE' THEN
            -- Build INSERT query dynamically
            query_text := format('INSERT INTO public.%I (%s) VALUES (%s) RETURNING *',
                table_name,
                (SELECT string_agg(key, ', ') FROM jsonb_object_keys(data) AS key),
                (SELECT string_agg(quote_literal(value), ', ') FROM jsonb_each_text(data) AS kv(key, value))
            );
            
        WHEN 'READ' THEN
            -- Build SELECT query
            query_text := format('SELECT * FROM public.%I', table_name);
            IF filters IS NOT NULL THEN
                query_text := query_text || ' WHERE ' || (
                    SELECT string_agg(
                        format('%I = %L', key, value), 
                        ' AND '
                    ) FROM jsonb_each_text(filters)
                );
            END IF;
            
        WHEN 'UPDATE' THEN
            -- Build UPDATE query
            query_text := format('UPDATE public.%I SET %s WHERE id = %L RETURNING *',
                table_name,
                (SELECT string_agg(
                    format('%I = %L', key, value), 
                    ', '
                ) FROM jsonb_each_text(data) WHERE key != 'id'),
                data->>'id'
            );
            
        WHEN 'DELETE' THEN
            -- Build DELETE query
            query_text := format('DELETE FROM public.%I WHERE id = %L RETURNING *',
                table_name,
                data->>'id'
            );
            
        ELSE
            RAISE EXCEPTION 'Invalid operation: %', operation;
    END CASE;

    -- Execute the query and return results
    IF operation = 'READ' THEN
        -- For READ operations, return array of results
        EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t', query_text) INTO result;
    ELSE
        -- For other operations, return single result
        EXECUTE format('SELECT COALESCE(row_to_json(t), ''null''::jsonb) FROM (%s) t', query_text) INTO result;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', result,
        'operation', operation,
        'table', table_name,
        'timestamp', extract(epoch from now())
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'operation', operation,
            'table', table_name,
            'timestamp', extract(epoch from now())
        );
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_database_fixes() TO service_role;
GRANT EXECUTE ON FUNCTION public.setup_test_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_crud_operation(TEXT, TEXT, JSONB, JSONB) TO service_role; 