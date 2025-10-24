-- =============================================
-- FIX LEADS STATUS CONSTRAINT
-- =============================================
-- This script will check existing status values and update the constraint

BEGIN;

-- 1. Check what status values currently exist in the database
-- =============================================

DO $$
DECLARE
    existing_statuses TEXT;
    status_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING LEAD STATUS VALUES ===';
    
    -- Get all unique status values
    FOR status_record IN
        SELECT DISTINCT status, COUNT(*) as count
        FROM public.leads 
        WHERE status IS NOT NULL
        GROUP BY status
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Status: % (% leads)', status_record.status, status_record.count;
    END LOOP;
    
    -- Get list of all unique statuses
    SELECT string_agg(DISTINCT '''' || status || '''', ', ' ORDER BY '''' || status || '''')
    INTO existing_statuses
    FROM public.leads 
    WHERE status IS NOT NULL;
    
    RAISE NOTICE '=== ALL EXISTING STATUSES ===';
    RAISE NOTICE 'Existing status values: %', existing_statuses;
END $$;

-- 2. Drop the constraint temporarily
-- =============================================

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 3. Create updated constraint with all possible values
-- =============================================
-- This includes Master DB values + any existing values in our database

ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    -- Master DB statuses (from analysis)
    'new', 'active', 'inactive', 'qualified', 'unqualified', 
    'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
    'nurturing', 'follow_up', 'contacted', 'not_contacted',
    'pending', 'archived', 'deleted', 'consideration',
    
    -- Additional common statuses that might exist
    'lead', 'prospect', 'customer', 'lost', 'won', 'demo', 'proposal',
    'negotiation', 'closed', 'open', 'in_progress', 'waiting', 'callback',
    'interested', 'not_interested', 'do_not_call', 'email_sent',
    
    -- Any null values should be allowed too
    NULL
) OR status IS NULL);

-- 4. Verify the constraint works
-- =============================================

DO $$
DECLARE
    constraint_violation_count INTEGER;
    violation_record RECORD;
BEGIN
    -- Check if there are any constraint violations
    SELECT COUNT(*) INTO constraint_violation_count
    FROM public.leads 
    WHERE status IS NOT NULL 
    AND status NOT IN (
        'new', 'active', 'inactive', 'qualified', 'unqualified', 
        'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
        'nurturing', 'follow_up', 'contacted', 'not_contacted',
        'pending', 'archived', 'deleted', 'consideration',
        'lead', 'prospect', 'customer', 'lost', 'won', 'demo', 'proposal',
        'negotiation', 'closed', 'open', 'in_progress', 'waiting', 'callback',
        'interested', 'not_interested', 'do_not_call', 'email_sent'
    );
    
    IF constraint_violation_count > 0 THEN
        RAISE NOTICE '=== CONSTRAINT VIOLATIONS FOUND ===';
        RAISE NOTICE 'Found % leads with unsupported status values:', constraint_violation_count;
        
        -- Show the problematic statuses
        FOR violation_record IN
            SELECT DISTINCT status, COUNT(*) as count
            FROM public.leads 
            WHERE status IS NOT NULL 
            AND status NOT IN (
                'new', 'active', 'inactive', 'qualified', 'unqualified', 
                'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
                'nurturing', 'follow_up', 'contacted', 'not_contacted',
                'pending', 'archived', 'deleted', 'consideration',
                'lead', 'prospect', 'customer', 'lost', 'won', 'demo', 'proposal',
                'negotiation', 'closed', 'open', 'in_progress', 'waiting', 'callback',
                'interested', 'not_interested', 'do_not_call', 'email_sent'
            )
            GROUP BY status
        LOOP
            RAISE NOTICE 'Unsupported status: % (% leads)', violation_record.status, violation_record.count;
        END LOOP;
        
        RAISE NOTICE 'These will need to be updated or added to the constraint.';
    ELSE
        RAISE NOTICE '=== ALL STATUS VALUES ARE SUPPORTED ===';
        RAISE NOTICE 'Constraint should work with all existing data.';
    END IF;
END $$;

COMMIT;

-- 5. Final verification query
-- =============================================

-- Show final status distribution
SELECT 
    COALESCE(status, 'NULL') as status_value,
    COUNT(*) as lead_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.leads 
GROUP BY status
ORDER BY lead_count DESC; 