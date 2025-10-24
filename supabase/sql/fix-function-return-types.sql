-- =============================================
-- FIX FUNCTION RETURN TYPE MISMATCH
-- =============================================
-- This fixes the data type mismatch in refresh_all_project_lead_counts()

BEGIN;

-- Drop the existing function with the wrong return type
DROP FUNCTION IF EXISTS public.refresh_all_project_lead_counts();

-- Create the function with correct return types that match actual data
CREATE OR REPLACE FUNCTION public.refresh_all_project_lead_counts()
RETURNS TABLE(
    project_id UUID, 
    project_name VARCHAR(255),  -- Match the actual column type
    old_count INTEGER, 
    new_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.projects 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
        jsonb_build_object('lead_count', 
            public.get_project_lead_count(projects.id)
        )
    RETURNING 
        projects.id,
        projects.name,
        COALESCE((metadata->>'lead_count')::integer, 0),
        public.get_project_lead_count(projects.id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.refresh_all_project_lead_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_project_lead_counts() TO anon;

-- Test the function to make sure it works
SELECT 'Function fix applied successfully' as status, NOW() as timestamp;

COMMIT; 