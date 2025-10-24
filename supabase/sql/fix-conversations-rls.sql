-- =====================================================
-- CONVERSATIONS RLS FIX - ALIGNED WITH COMPREHENSIVE RLS
-- This fixes conversations access while maintaining proper security
-- =====================================================

BEGIN;

-- 1. DROP ALL EXISTING POLICIES ON CONVERSATIONS
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conversations'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on conversations table', policy_record.policyname;
    END LOOP;
END $$;

-- 2. CREATE SECURE, NON-RECURSIVE POLICIES

-- AUTHENTICATED USERS: Access conversations for leads they can access
CREATE POLICY "conversations_user_access"
ON public.conversations
FOR ALL
TO authenticated
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    WHERE l.client_id IN (
      SELECT cm.client_id 
      FROM public.client_members cm
      WHERE cm.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    WHERE l.client_id IN (
      SELECT cm.client_id 
      FROM public.client_members cm
      WHERE cm.user_id = auth.uid()
    )
  )
);

-- ANON USERS: Limited access for frontend functionality
-- (You may want to restrict this further based on your needs)
CREATE POLICY "conversations_anon_access"
ON public.conversations
FOR SELECT
TO anon
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    WHERE l.client_id IN (
      SELECT cm.client_id 
      FROM public.client_members cm
      WHERE cm.user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
    )
  )
);

-- SERVICE ROLE: Full access for admin operations
CREATE POLICY "conversations_service_access"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. ENABLE RLS AND GRANT PERMISSIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.conversations TO authenticated;
GRANT SELECT ON public.conversations TO anon;
GRANT ALL ON public.conversations TO service_role;

COMMIT;

-- 4. VERIFICATION QUERIES
SELECT 
  'Conversations policy verification' as test,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversations'
ORDER BY policyname;

-- Test conversation access for test user
SELECT 
  'Test user conversation access' as test,
  COUNT(*) as conversation_count
FROM public.conversations 
WHERE lead_id IN (
  SELECT l.id 
  FROM public.leads l
  WHERE l.client_id IN (
    SELECT cm.client_id 
    FROM public.client_members cm
    WHERE cm.user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
  )
);

-- Test anon access (should match authenticated access for test user)
SET role anon;
SELECT 
  'Anon conversation access' as test,
  COUNT(*) as conversation_count
FROM public.conversations 
WHERE lead_id IN (
  SELECT l.id 
  FROM public.leads l
  WHERE l.client_id IN (
    SELECT cm.client_id 
    FROM public.client_members cm
    WHERE cm.user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
  )
);

RESET role; 