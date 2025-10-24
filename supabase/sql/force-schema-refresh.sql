-- =============================================
-- FORCE SCHEMA CACHE REFRESH
-- =============================================
-- This will force PostgREST to reload its schema cache

BEGIN;

-- Method 1: Send NOTIFY to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Send NOTIFY to reload config (more aggressive)
NOTIFY pgrst, 'reload config';

-- Method 3: Verify columns exist in information_schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'projects', 'leads')
    AND column_name IN ('description', 'contact_info', 'metadata', 'family_name', 'processing_state')
ORDER BY table_name, column_name;

-- Method 4: Create a dummy function to force cache refresh
CREATE OR REPLACE FUNCTION public.force_schema_refresh()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 'Schema refresh triggered at ' || NOW()::text;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.force_schema_refresh() TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_schema_refresh() TO anon;

COMMIT;

-- Test if we can access the new columns via a query
SELECT 
    COUNT(*) as total_clients,
    COUNT(description) as clients_with_description,
    COUNT(contact_info) as clients_with_contact_info
FROM public.clients; 