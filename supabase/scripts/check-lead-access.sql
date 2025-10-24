-- 🔍 CHECK LEAD ACCESS FOR test@test.test
-- This checks why leads are blocked while conversations are accessible

SELECT 'LEAD ACCESS CHECK:' as section;

-- Count leads that test user can access
SELECT 
  'Leads accessible to test user:' as check_type,
  COUNT(*) as accessible_leads
FROM public.leads l
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.email = 'test@test.test'
    AND (
      -- Through client membership
      EXISTS (
        SELECT 1 FROM public.client_members cm
        WHERE cm.client_id = l.client_id AND cm.user_id = u.id
      )
      OR
      -- Through project membership  
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = l.current_project_id AND pm.user_id = u.id
      )
      OR
      -- Through lead membership
      EXISTS (
        SELECT 1 FROM public.lead_members lm
        WHERE lm.lead_id = l.id AND lm.user_id = u.id
      )
    )
);

SELECT 'ORPHANED CONVERSATIONS:' as section;

-- Find conversations that are accessible but their leads are not
SELECT 
  'Conversations with inaccessible leads:' as check_type,
  COUNT(*) as orphaned_conversations
FROM public.conversations c
WHERE 
  -- Conversation is accessible to test user
  EXISTS (
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
  AND
  -- But lead is NOT accessible to test user
  NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.email = 'test@test.test'
      AND (
        EXISTS (
          SELECT 1 FROM public.client_members cm
          JOIN public.leads l ON l.client_id = cm.client_id AND l.id = c.lead_id
          WHERE cm.user_id = u.id
        )
        OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          JOIN public.leads l ON l.current_project_id = pm.project_id AND l.id = c.lead_id
          WHERE pm.user_id = u.id
        )
        OR
        EXISTS (
          SELECT 1 FROM public.lead_members lm
          WHERE lm.lead_id = c.lead_id AND lm.user_id = u.id
        )
      )
  );

SELECT 'MEMBERSHIP DETAILS:' as section;

-- Show what memberships the test user has
SELECT 
  'client_members' as membership_type,
  cm.role,
  c.name as client_name
FROM public.client_members cm
JOIN auth.users u ON u.id = cm.user_id
JOIN public.clients c ON c.id = cm.client_id
WHERE u.email = 'test@test.test'

UNION ALL

SELECT 
  'project_members' as membership_type,
  pm.role,
  p.name as project_name
FROM public.project_members pm
JOIN auth.users u ON u.id = pm.user_id
JOIN public.projects p ON p.id = pm.project_id
WHERE u.email = 'test@test.test'

UNION ALL

SELECT 
  'lead_members' as membership_type,
  lm.role,
  COALESCE(l.first_name || ' ' || l.last_name, l.first_name, 'Unnamed Lead') as lead_name
FROM public.lead_members lm
JOIN auth.users u ON u.id = lm.user_id
JOIN public.leads l ON l.id = lm.lead_id
WHERE u.email = 'test@test.test'; 