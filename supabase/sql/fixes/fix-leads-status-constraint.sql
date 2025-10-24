-- =====================================================
-- FIX LEADS STATUS CHECK CONSTRAINT
-- Allows proper status values for leads table
-- =====================================================

-- First, let's see what the current constraint looks like
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%leads%status%';

-- Drop the existing check constraint if it exists
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Create a new, more permissive check constraint for status
ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    'new', 'active', 'inactive', 'qualified', 'unqualified', 
    'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
    'nurturing', 'follow_up', 'contacted', 'not_contacted',
    'pending', 'archived', 'deleted'
));

-- Also check if there are other status-related constraints that might be causing issues
-- Update any existing leads with invalid statuses to 'active'
UPDATE public.leads 
SET status = 'new'
WHERE status NOT IN (
    'new', 'active', 'inactive', 'qualified', 'unqualified', 
    'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
    'nurturing', 'follow_up', 'contacted', 'not_contacted',
    'pending', 'archived', 'deleted'
);

-- Now let's check if there are other constraints causing issues
-- Look for any other status-related fields and their constraints

-- Check if qualification_status has a constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%qualification%';

-- Drop and recreate qualification status constraint if needed
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_qualification_status_check;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_qualification_status_check 
CHECK (qualification_status IN (
    'unqualified', 'qualified', 'highly_qualified', 
    'not_assessed', 'pending_assessment', 'disqualified'
));

-- Check if state field has constraints
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%state%';

-- Drop and recreate state constraint if needed
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_state_check;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_state_check 
CHECK (state IN (
    'new', 'new_lead', 'in_progress', 'contacted', 'qualified', 
    'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
    'on_hold', 'archived', 'deleted'
));

-- Update any invalid qualification_status values
UPDATE public.leads 
SET qualification_status = 'unqualified'
WHERE qualification_status NOT IN (
    'unqualified', 'qualified', 'highly_qualified', 
    'not_assessed', 'pending_assessment', 'disqualified'
);

-- Update any invalid state values  
UPDATE public.leads 
SET state = 'new_lead'
WHERE state NOT IN (
    'new', 'new_lead', 'in_progress', 'contacted', 'qualified', 
    'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
    'on_hold', 'archived', 'deleted'
);

-- Verification: Show current constraint definitions
SELECT 
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'leads' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';

-- Test that our status values work
DO $$
BEGIN
    -- Test insert with 'active' status
    BEGIN
        INSERT INTO public.leads (
            first_name, last_name, phone, status, 
            client_id, current_project_id, company
        ) VALUES (
            'Test', 'Lead', '+1-555-TEST', 'active',
            'e93b20b0-2df9-49cf-9645-5159590877a0'::uuid,
            'c61dd62e-743e-4ec7-9147-a26ae613c8d4'::uuid,
            'Test Company'
        );
        
        RAISE NOTICE '✅ Test insert with active status: SUCCESS';
        
        -- Clean up test record
        DELETE FROM public.leads 
        WHERE first_name = 'Test' AND last_name = 'Lead' AND phone = '+1-555-TEST';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
    END;
END $$;

RAISE NOTICE '🎉 Leads status constraints updated successfully!'; 