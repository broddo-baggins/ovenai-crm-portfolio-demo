-- 🚨 NUCLEAR TRUNCATE HELPER FUNCTION
-- Run this in Supabase SQL Editor BEFORE running the nuclear script
-- This creates a function that bypasses RLS for complete table truncation

-- Create function to truncate leads table (bypasses RLS)
CREATE OR REPLACE FUNCTION custom_truncate_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Temporarily disable RLS
    ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
    
    -- Truncate the table
    TRUNCATE TABLE public.leads RESTART IDENTITY CASCADE;
    
    -- Re-enable RLS
    ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Successfully truncated leads table';
END;
$$;

-- Grant execution to service role
GRANT EXECUTE ON FUNCTION custom_truncate_leads() TO service_role;

-- Test the function (optional - remove if you don't want to test)
-- SELECT custom_truncate_leads();

-- Verification query to check if function was created
SELECT 'Function created successfully' as status; 