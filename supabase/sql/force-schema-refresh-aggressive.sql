-- =============================================
-- AGGRESSIVE SCHEMA CACHE REFRESH
-- =============================================
-- This makes a harmless schema change to force PostgREST to reload

BEGIN;

-- Method 1: Multiple NOTIFY attempts
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Method 2: Create and drop a dummy function to force schema change
CREATE OR REPLACE FUNCTION public.force_cache_refresh_dummy()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 'Cache refresh forced at ' || NOW()::text;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.force_cache_refresh_dummy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_cache_refresh_dummy() TO anon;

-- Method 3: Add a comment to a table (triggers schema change)
COMMENT ON TABLE public.clients IS 'Client data table - cache refresh trigger';

-- Method 4: Create a view that forces PostgREST to re-examine the schema
CREATE OR REPLACE VIEW public.client_schema_test AS
SELECT 
    id,
    name,
    description,
    contact_info,
    created_at,
    updated_at
FROM public.clients
LIMIT 1;

-- Grant access to the view
GRANT SELECT ON public.client_schema_test TO authenticated;
GRANT SELECT ON public.client_schema_test TO anon;

-- Method 5: Refresh materialized views if any exist
-- (This is just in case there are any)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname);
    END LOOP;
END
$$;

COMMIT;

-- Test query to verify schema is accessible
SELECT 
    'Schema refresh test' as test_type,
    COUNT(*) as client_count,
    COUNT(description) as description_count,
    COUNT(contact_info) as contact_info_count,
    NOW() as timestamp
FROM public.clients; 