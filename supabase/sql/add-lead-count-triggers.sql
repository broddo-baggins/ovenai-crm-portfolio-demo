-- =============================================
-- LEAD COUNT UPDATE TRIGGERS
-- =============================================
-- This will automatically update lead counts when leads change projects

BEGIN;

-- 1. Create function to update lead counts
-- =============================================

CREATE OR REPLACE FUNCTION public.update_project_lead_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_project_id UUID;
    new_project_id UUID;
BEGIN
    -- Handle different trigger operations
    CASE TG_OP
        WHEN 'INSERT' THEN
            -- New lead added to project
            IF NEW.current_project_id IS NOT NULL THEN
                -- Update the new project's lead count
                UPDATE public.projects 
                SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                    jsonb_build_object('lead_count', 
                        COALESCE((metadata->>'lead_count')::integer, 0) + 1
                    )
                WHERE id = NEW.current_project_id;
            END IF;
            RETURN NEW;
            
        WHEN 'UPDATE' THEN
            old_project_id := OLD.current_project_id;
            new_project_id := NEW.current_project_id;
            
            -- Only proceed if project actually changed
            IF old_project_id IS DISTINCT FROM new_project_id THEN
                -- Decrease count in old project
                IF old_project_id IS NOT NULL THEN
                    UPDATE public.projects 
                    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                        jsonb_build_object('lead_count', 
                            GREATEST(COALESCE((metadata->>'lead_count')::integer, 1) - 1, 0)
                        )
                    WHERE id = old_project_id;
                END IF;
                
                -- Increase count in new project
                IF new_project_id IS NOT NULL THEN
                    UPDATE public.projects 
                    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                        jsonb_build_object('lead_count', 
                            COALESCE((metadata->>'lead_count')::integer, 0) + 1
                        )
                    WHERE id = new_project_id;
                END IF;
            END IF;
            RETURN NEW;
            
        WHEN 'DELETE' THEN
            -- Lead removed from project
            IF OLD.current_project_id IS NOT NULL THEN
                UPDATE public.projects 
                SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                    jsonb_build_object('lead_count', 
                        GREATEST(COALESCE((metadata->>'lead_count')::integer, 1) - 1, 0)
                    )
                WHERE id = OLD.current_project_id;
            END IF;
            RETURN OLD;
    END CASE;
    
    RETURN NULL;
END;
$$;

-- 2. Create triggers for lead count updates
-- =============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_project_lead_counts_insert_trg ON public.leads;
DROP TRIGGER IF EXISTS update_project_lead_counts_update_trg ON public.leads;
DROP TRIGGER IF EXISTS update_project_lead_counts_delete_trg ON public.leads;

-- Create new triggers
CREATE TRIGGER update_project_lead_counts_insert_trg
    AFTER INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_project_lead_counts();

CREATE TRIGGER update_project_lead_counts_update_trg
    AFTER UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_project_lead_counts();

CREATE TRIGGER update_project_lead_counts_delete_trg
    AFTER DELETE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_project_lead_counts();

-- 3. Initial calculation of existing lead counts
-- =============================================

-- Update all existing projects with current lead counts
UPDATE public.projects 
SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object('lead_count', 
        COALESCE((
            SELECT COUNT(*)::integer 
            FROM public.leads 
            WHERE current_project_id = projects.id
        ), 0)
    );

-- 4. Create helper function to get project lead count
-- =============================================

CREATE OR REPLACE FUNCTION public.get_project_lead_count(project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_count INTEGER;
BEGIN
    SELECT COUNT(*)::integer INTO lead_count
    FROM public.leads 
    WHERE current_project_id = project_id;
    
    RETURN COALESCE(lead_count, 0);
END;
$$;

-- 5. Create helper function to refresh all project lead counts
-- =============================================

CREATE OR REPLACE FUNCTION public.refresh_all_project_lead_counts()
RETURNS TABLE(project_id UUID, project_name TEXT, old_count INTEGER, new_count INTEGER)
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
        projects.id as project_id,
        projects.name as project_name,
        COALESCE((metadata->>'lead_count')::integer, 0) as old_count,
        public.get_project_lead_count(projects.id) as new_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_project_lead_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_lead_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_project_lead_counts() TO authenticated;

COMMIT;

-- Verification queries
-- =============================================

-- Check current project lead counts
SELECT 
    p.id,
    p.name,
    COALESCE((p.metadata->>'lead_count')::integer, 0) as stored_count,
    COUNT(l.id)::integer as actual_count,
    CASE 
        WHEN COALESCE((p.metadata->>'lead_count')::integer, 0) = COUNT(l.id)::integer 
        THEN '✅ MATCH' 
        ELSE '❌ MISMATCH' 
    END as status
FROM public.projects p
LEFT JOIN public.leads l ON l.current_project_id = p.id
GROUP BY p.id, p.name, p.metadata
ORDER BY p.name;

-- Test the refresh function
SELECT * FROM public.refresh_all_project_lead_counts(); 