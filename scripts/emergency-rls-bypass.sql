-- 🚨 EMERGENCY RLS BYPASS FOR LEADS TABLE
-- ENSURE SERVICE ROLE CAN DELETE LEADS
-- Run this in Supabase SQL Editor if deletion fails

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can delete leads they own" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their leads" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

-- Create service role bypass policy (if not exists)
DO $$
BEGIN
    -- Check if service role policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'leads' 
        AND policyname = 'leads_service_role_bypass'
    ) THEN
        -- Create service role bypass policy
        CREATE POLICY "leads_service_role_bypass"
        ON public.leads
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE '✅ Created service role bypass policy for leads';
    ELSE
        RAISE NOTICE '✅ Service role bypass policy already exists';
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
    
    -- Grant permissions to service role
    GRANT ALL ON public.leads TO service_role;
    
    RAISE NOTICE '✅ Service role can now delete leads';
    
END $$; 