-- =============================================
-- EXTENSION PLACEMENT SECURITY FIX
-- =============================================
-- 
-- This script fixes extension placement security issues by moving
-- extensions from the public schema to dedicated schemas.
--
-- Based on Supabase database linter recommendations:
-- https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

-- =============================================
-- CREATE DEDICATED SCHEMAS FOR EXTENSIONS
-- =============================================

-- Create extensions schema for general extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create http schema specifically for HTTP extension
CREATE SCHEMA IF NOT EXISTS http;

-- Create fdw schema for foreign data wrappers
CREATE SCHEMA IF NOT EXISTS fdw;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO public, authenticated, service_role;
GRANT USAGE ON SCHEMA http TO public, authenticated, service_role;
GRANT USAGE ON SCHEMA fdw TO public, authenticated, service_role;

-- =============================================
-- MOVE HTTP EXTENSION
-- =============================================

-- Check if http extension exists in public schema
DO $$
DECLARE
    ext_exists boolean;
    ext_schema text;
BEGIN
    -- Check if http extension exists and where it's installed
    SELECT EXISTS(
        SELECT 1 FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE e.extname = 'http'
    ), n.nspname
    INTO ext_exists, ext_schema
    FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'http';
    
    IF ext_exists THEN
        RAISE NOTICE 'HTTP extension found in schema: %', ext_schema;
        
        IF ext_schema = 'public' THEN
            RAISE NOTICE 'Moving HTTP extension from public to http schema...';
            
            -- Drop the extension from public schema
            DROP EXTENSION IF EXISTS http CASCADE;
            
            -- Recreate in http schema
            CREATE EXTENSION IF NOT EXISTS http SCHEMA http;
            
            RAISE NOTICE '✅ HTTP extension moved to http schema';
        ELSE
            RAISE NOTICE 'ℹ️  HTTP extension already in non-public schema: %', ext_schema;
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  HTTP extension not found, creating in http schema...';
        
        -- Create extension in http schema
        CREATE EXTENSION IF NOT EXISTS http SCHEMA http;
        
        RAISE NOTICE '✅ HTTP extension created in http schema';
    END IF;
END $$;

-- =============================================
-- MOVE POSTGRES_FDW EXTENSION
-- =============================================

-- Check if postgres_fdw extension exists in public schema
DO $$
DECLARE
    ext_exists boolean;
    ext_schema text;
BEGIN
    -- Check if postgres_fdw extension exists and where it's installed
    SELECT EXISTS(
        SELECT 1 FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE e.extname = 'postgres_fdw'
    ), n.nspname
    INTO ext_exists, ext_schema
    FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'postgres_fdw';
    
    IF ext_exists THEN
        RAISE NOTICE 'postgres_fdw extension found in schema: %', ext_schema;
        
        IF ext_schema = 'public' THEN
            RAISE NOTICE 'Moving postgres_fdw extension from public to fdw schema...';
            
            -- Note: postgres_fdw may have dependencies, so we need to be careful
            -- First, check for any foreign servers or user mappings
            PERFORM 1 FROM pg_foreign_server LIMIT 1;
            
            IF FOUND THEN
                RAISE NOTICE '⚠️  Foreign servers exist. Manual migration may be required.';
                -- For safety, we'll create the extension in the new schema without dropping the old one
                -- The admin can manually clean up after verifying everything works
                BEGIN
                    CREATE EXTENSION IF NOT EXISTS postgres_fdw SCHEMA fdw;
                    RAISE NOTICE '✅ postgres_fdw extension created in fdw schema (original remains for safety)';
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '❌ Failed to create postgres_fdw in fdw schema: %', SQLERRM;
                END;
            ELSE
                -- Safe to move since no foreign servers exist
                DROP EXTENSION IF EXISTS postgres_fdw CASCADE;
                CREATE EXTENSION IF NOT EXISTS postgres_fdw SCHEMA fdw;
                RAISE NOTICE '✅ postgres_fdw extension moved to fdw schema';
            END IF;
        ELSE
            RAISE NOTICE 'ℹ️  postgres_fdw extension already in non-public schema: %', ext_schema;
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  postgres_fdw extension not found, creating in fdw schema...';
        
        -- Create extension in fdw schema
        CREATE EXTENSION IF NOT EXISTS postgres_fdw SCHEMA fdw;
        
        RAISE NOTICE '✅ postgres_fdw extension created in fdw schema';
    END IF;
END $$;

-- =============================================
-- MOVE OTHER COMMON EXTENSIONS
-- =============================================

-- Function to safely move extensions
CREATE OR REPLACE FUNCTION move_extension_to_schema(
    extension_name text,
    target_schema text
) RETURNS text AS $$
DECLARE
    ext_exists boolean;
    current_schema text;
    result text;
BEGIN
    -- Check if extension exists and get current schema
    SELECT EXISTS(
        SELECT 1 FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE e.extname = extension_name
    ), n.nspname
    INTO ext_exists, current_schema
    FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = extension_name;
    
    IF NOT ext_exists THEN
        result := format('Extension %s not found', extension_name);
        RETURN result;
    END IF;
    
    IF current_schema = 'public' THEN
        BEGIN
            -- Create target schema if it doesn't exist
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', target_schema);
            
            -- Move extension
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA %I', extension_name, target_schema);
            
            result := format('✅ Moved %s from public to %s schema', extension_name, target_schema);
        EXCEPTION WHEN OTHERS THEN
            result := format('❌ Failed to move %s: %s', extension_name, SQLERRM);
        END;
    ELSE
        result := format('ℹ️  Extension %s already in schema %s', extension_name, current_schema);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Move other common extensions that might be in public schema
SELECT move_extension_to_schema('uuid-ossp', 'extensions');
SELECT move_extension_to_schema('pgcrypto', 'extensions');
SELECT move_extension_to_schema('pg_stat_statements', 'extensions');
SELECT move_extension_to_schema('pg_trgm', 'extensions');
SELECT move_extension_to_schema('btree_gin', 'extensions');
SELECT move_extension_to_schema('btree_gist', 'extensions');
SELECT move_extension_to_schema('citext', 'extensions');
SELECT move_extension_to_schema('hstore', 'extensions');
SELECT move_extension_to_schema('ltree', 'extensions');
SELECT move_extension_to_schema('unaccent', 'extensions');

-- =============================================
-- UPDATE FUNCTION CALLS TO USE NEW SCHEMAS
-- =============================================

-- Update any functions that might reference the old extension locations
-- This is particularly important for HTTP extension usage

-- Create wrapper functions in public schema for easy access
CREATE OR REPLACE FUNCTION public.http_get(url text)
RETURNS http.http_response AS $$
BEGIN
    RETURN http.http_get(url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, http;

CREATE OR REPLACE FUNCTION public.http_post(url text, content text, content_type text DEFAULT 'application/json')
RETURNS http.http_response AS $$
BEGIN
    RETURN http.http_post(url, content, content_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, http;

CREATE OR REPLACE FUNCTION public.http_put(url text, content text, content_type text DEFAULT 'application/json')
RETURNS http.http_response AS $$
BEGIN
    RETURN http.http_put(url, content, content_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, http;

CREATE OR REPLACE FUNCTION public.http_delete(url text)
RETURNS http.http_response AS $$
BEGIN
    RETURN http.http_delete(url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, http;

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant permissions on new schemas
GRANT USAGE ON SCHEMA extensions TO public, authenticated, service_role;
GRANT USAGE ON SCHEMA http TO public, authenticated, service_role;
GRANT USAGE ON SCHEMA fdw TO public, authenticated, service_role;

-- Grant execute permissions on http functions through public wrappers
GRANT EXECUTE ON FUNCTION public.http_get(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.http_post(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.http_put(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.http_delete(text) TO authenticated, service_role;

-- =============================================
-- CREATE MONITORING AND VERIFICATION
-- =============================================

-- Function to check extension placements
CREATE OR REPLACE FUNCTION public.check_extension_placements()
RETURNS TABLE(
    extension_name text,
    schema_name text,
    is_in_public boolean,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.extname::text as extension_name,
        n.nspname::text as schema_name,
        (n.nspname = 'public') as is_in_public,
        CASE 
            WHEN n.nspname = 'public' THEN 'Move to dedicated schema'
            ELSE 'OK'
        END::text as recommendation
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname NOT IN ('plpgsql') -- Exclude built-in extensions
    ORDER BY is_in_public DESC, extension_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to monitoring function
GRANT EXECUTE ON FUNCTION public.check_extension_placements() TO authenticated, service_role;

-- =============================================
-- UPDATE SEARCH PATHS FOR APPLICATIONS
-- =============================================

-- Update default search path to include extension schemas
-- This ensures applications can still find extension functions
ALTER DATABASE postgres SET search_path = public, extensions, http, fdw;

-- Note: You may need to reconnect or run the following in your application:
-- SET search_path = public, extensions, http, fdw;

-- =============================================
-- CLEANUP
-- =============================================

-- Drop the helper function
DROP FUNCTION IF EXISTS move_extension_to_schema(text, text);

-- =============================================
-- VERIFICATION AND REPORTING
-- =============================================

-- Check current extension placements
SELECT 
    'Extension Placement Security Fix Complete' as status,
    NOW() as timestamp;

-- Show current extension placements
SELECT 
    'Current Extension Placements:' as info;

SELECT * FROM public.check_extension_placements();

-- Show any remaining issues
SELECT 
    COUNT(*) as extensions_still_in_public
FROM public.check_extension_placements()
WHERE is_in_public = true;

-- Provide guidance for any remaining issues
DO $$
DECLARE
    remaining_count integer;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM public.check_extension_placements()
    WHERE is_in_public = true;
    
    IF remaining_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  % extensions still in public schema', remaining_count;
        RAISE NOTICE 'Manual intervention may be required for some extensions.';
        RAISE NOTICE 'Check the output of check_extension_placements() for details.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All extensions have been moved out of public schema';
    END IF;
END $$; 