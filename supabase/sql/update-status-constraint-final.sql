-- =============================================
-- FINAL STATUS CONSTRAINT UPDATE
-- =============================================
-- Based on your actual database values: unqualified, awareness, consideration, interest

BEGIN;

-- Drop existing constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Create constraint with your actual values + Master DB values for compatibility
ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    -- Your existing values
    'unqualified', 'awareness', 'consideration', 'interest',
    
    -- Master DB values (from analysis)
    'new', 'active', 'inactive', 'qualified',
    'hot', 'warm', 'cold', 'converted', 'closed_won', 'closed_lost',
    'nurturing', 'follow_up', 'contacted', 'not_contacted',
    'pending', 'archived', 'deleted',
    
    -- Additional common statuses for flexibility
    'lead', 'prospect', 'customer', 'lost', 'won', 'demo', 'proposal',
    'negotiation', 'closed', 'open', 'in_progress', 'waiting', 'callback',
    'interested', 'not_interested', 'do_not_call', 'email_sent'
) OR status IS NULL);

COMMIT;

-- Verify constraint works
SELECT 
    status,
    COUNT(*) as count,
    'OK' as constraint_status
FROM public.leads 
GROUP BY status
ORDER BY count DESC; 