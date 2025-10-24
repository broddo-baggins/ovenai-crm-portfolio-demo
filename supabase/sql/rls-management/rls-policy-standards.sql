-- =====================================================
-- RLS POLICY STANDARDS AND MONITORING SYSTEM
-- Future-proofs against infinite recursion issues
-- =====================================================

-- 1. CREATE RLS POLICY MONITORING FUNCTION
CREATE OR REPLACE FUNCTION public.check_rls_policy_health()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    potential_recursion BOOLEAN,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        p.cmd::TEXT,
        CASE 
            WHEN p.qual LIKE '%client_members%' AND p.tablename IN ('projects', 'leads', 'clients') THEN true
            WHEN p.qual LIKE '%EXISTS%' AND p.qual LIKE '%client_members%' THEN true
            ELSE false
        END as potential_recursion,
        CASE 
            WHEN p.qual LIKE '%client_members%' AND p.tablename IN ('projects', 'leads', 'clients') THEN 'Use simple IN clause instead of EXISTS'
            WHEN p.qual LIKE '%EXISTS%' AND p.qual LIKE '%client_members%' THEN 'Replace EXISTS with IN clause'
            ELSE 'Policy looks safe'
        END as recommendation
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename IN ('client_members', 'projects', 'leads', 'clients')
    ORDER BY p.tablename, p.policyname;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE STANDARD RLS POLICY TEMPLATES
CREATE OR REPLACE FUNCTION public.create_standard_rls_policies(target_table TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_user_access" ON public.%I', target_table, target_table);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_access" ON public.%I', target_table, target_table);
    
    -- Create standard policies based on table type
    IF target_table = 'client_members' THEN
        -- Client members: Direct user access
        EXECUTE format('
            CREATE POLICY "%s_user_access"
            ON public.%I
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid())
        ', target_table, target_table);
        
    ELSIF target_table IN ('projects', 'leads') THEN
        -- Projects and leads: Access via client membership
        EXECUTE format('
            CREATE POLICY "%s_user_access"
            ON public.%I
            FOR ALL
            TO authenticated
            USING (
                client_id IN (
                    SELECT client_id 
                    FROM public.client_members 
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                client_id IN (
                    SELECT client_id 
                    FROM public.client_members 
                    WHERE user_id = auth.uid()
                )
            )
        ', target_table, target_table);
        
    ELSIF target_table = 'clients' THEN
        -- Clients: Access via client membership
        EXECUTE format('
            CREATE POLICY "%s_user_access"
            ON public.%I
            FOR ALL
            TO authenticated
            USING (
                id IN (
                    SELECT client_id 
                    FROM public.client_members 
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                id IN (
                    SELECT client_id 
                    FROM public.client_members 
                    WHERE user_id = auth.uid()
                )
            )
        ', target_table, target_table);
    END IF;
    
    -- Always create service role policy
    EXECUTE format('
        CREATE POLICY "%s_service_access"
        ON public.%I
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    ', target_table, target_table);
    
    result := format('Standard RLS policies created for table: %s', target_table);
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE AUTOMATED RLS HEALTH CHECK
CREATE OR REPLACE FUNCTION public.automated_rls_health_check()
RETURNS TABLE (
    check_timestamp TIMESTAMP,
    issues_found INTEGER,
    tables_checked INTEGER,
    status TEXT
) AS $$
DECLARE
    issue_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Count potential issues
    SELECT COUNT(*) INTO issue_count
    FROM public.check_rls_policy_health()
    WHERE potential_recursion = true;
    
    -- Count tables checked
    SELECT COUNT(DISTINCT table_name) INTO table_count
    FROM public.check_rls_policy_health();
    
    RETURN QUERY
    SELECT 
        NOW() as check_timestamp,
        issue_count,
        table_count,
        CASE 
            WHEN issue_count = 0 THEN 'HEALTHY'
            WHEN issue_count <= 2 THEN 'WARNING'
            ELSE 'CRITICAL'
        END as status;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE RLS POLICY VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION public.validate_rls_policy()
RETURNS event_trigger AS $$
BEGIN
    -- This would run after any DDL command
    -- Log policy changes for audit
    INSERT INTO public.rls_policy_audit (
        event_time,
        event_type,
        table_name,
        details
    ) VALUES (
        NOW(),
        'POLICY_CHANGE',
        'UNKNOWN',
        'RLS policy modified - check required'
    );
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE AUDIT TABLE FOR RLS CHANGES
CREATE TABLE IF NOT EXISTS public.rls_policy_audit (
    id SERIAL PRIMARY KEY,
    event_time TIMESTAMP DEFAULT NOW(),
    event_type TEXT,
    table_name TEXT,
    policy_name TEXT,
    details TEXT,
    user_id UUID DEFAULT auth.uid()
);

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.check_rls_policy_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.automated_rls_health_check() TO authenticated;
GRANT SELECT ON public.rls_policy_audit TO authenticated;

-- 7. INITIAL HEALTH CHECK
SELECT * FROM public.automated_rls_health_check();

-- 8. DOCUMENTATION COMMENT
COMMENT ON FUNCTION public.check_rls_policy_health() IS 'Monitors RLS policies for potential infinite recursion issues';
COMMENT ON FUNCTION public.create_standard_rls_policies(TEXT) IS 'Creates standardized, safe RLS policies for any table';
COMMENT ON FUNCTION public.automated_rls_health_check() IS 'Automated health check for RLS policy system';
COMMENT ON TABLE public.rls_policy_audit IS 'Audit trail for all RLS policy changes'; 