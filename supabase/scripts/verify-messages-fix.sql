-- 🔍 VERIFY MESSAGES FIX - Check data alignment between conversations and leads
-- This checks if the getAllLeads(undefined, true) fix will resolve the mismatch

-- STEP 1: Check how many conversations vs leads the test user can access
SELECT 'USER ACCESS SUMMARY' as section;

SELECT 
  'Conversations user can access' as item,
  COUNT(*) as count
FROM public.conversations c
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.email = 'test@test.test'
    AND (
      -- Through client membership  
      EXISTS (
        SELECT 1 FROM public.client_members cm
        JOIN public.leads l ON l.client_id = cm.client_id
        WHERE l.id = c.lead_id AND cm.user_id = u.id
      )
      OR
      -- Through conversation membership
      EXISTS (
        SELECT 1 FROM public.conversation_members convm
        WHERE convm.conversation_id = c.id AND convm.user_id = u.id
      )
    )
)

UNION ALL

SELECT 
  'Leads user can access (ALL projects)' as item,
  COUNT(*) as count
FROM public.leads l
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  JOIN public.client_members cm ON cm.user_id = u.id
  WHERE u.email = 'test@test.test'
    AND l.client_id = cm.client_id
)

UNION ALL

SELECT 
  'Conversations WITH matching accessible leads' as item,
  COUNT(*) as count
FROM public.conversations c
WHERE EXISTS (
  -- Conversation is accessible
  SELECT 1 FROM auth.users u
  WHERE u.email = 'test@test.test'
    AND (
      EXISTS (
        SELECT 1 FROM public.client_members cm
        JOIN public.leads l ON l.client_id = cm.client_id
        WHERE l.id = c.lead_id AND cm.user_id = u.id
      )
      OR
      EXISTS (
        SELECT 1 FROM public.conversation_members convm
        WHERE convm.conversation_id = c.id AND convm.user_id = u.id
      )
    )
)
AND EXISTS (
  -- Lead is also accessible
  SELECT 1 FROM auth.users u
  JOIN public.client_members cm ON cm.user_id = u.id
  JOIN public.leads l ON l.client_id = cm.client_id
  WHERE u.email = 'test@test.test'
    AND l.id = c.lead_id
);

-- STEP 2: Check for orphaned conversations (accessible conversations without accessible leads)
SELECT 'ORPHANED CONVERSATIONS' as section;

SELECT 
  c.id as conversation_id,
  c.lead_id,
  l.first_name || ' ' || l.last_name as lead_name,
  l.client_id,
  cl.name as client_name,
  'Missing lead access for this conversation' as issue
FROM public.conversations c
LEFT JOIN public.leads l ON l.id = c.lead_id
LEFT JOIN public.clients cl ON cl.id = l.client_id
WHERE EXISTS (
  -- Conversation is accessible
  SELECT 1 FROM auth.users u
  WHERE u.email = 'test@test.test'
    AND (
      EXISTS (
        SELECT 1 FROM public.client_members cm
        JOIN public.leads l2 ON l2.client_id = cm.client_id
        WHERE l2.id = c.lead_id AND cm.user_id = u.id
      )
      OR
      EXISTS (
        SELECT 1 FROM public.conversation_members convm
        WHERE convm.conversation_id = c.id AND convm.user_id = u.id
      )
    )
)
AND NOT EXISTS (
  -- But lead is NOT accessible through direct client membership
  SELECT 1 FROM auth.users u
  JOIN public.client_members cm ON cm.user_id = u.id
  JOIN public.leads l2 ON l2.client_id = cm.client_id
  WHERE u.email = 'test@test.test'
    AND l2.id = c.lead_id
)
LIMIT 10;

-- STEP 3: Project distribution analysis
SELECT 'PROJECT DISTRIBUTION' as section;

SELECT 
  p.name as project_name,
  p.id as project_id,
  COUNT(DISTINCT l.id) as leads_count,
  COUNT(DISTINCT c.id) as conversations_count
FROM public.projects p
JOIN public.client_members cm ON cm.client_id = p.client_id
JOIN auth.users u ON u.id = cm.user_id
LEFT JOIN public.leads l ON l.current_project_id = p.id
LEFT JOIN public.conversations c ON c.lead_id = l.id
WHERE u.email = 'test@test.test'
GROUP BY p.id, p.name
ORDER BY conversations_count DESC
LIMIT 10; 