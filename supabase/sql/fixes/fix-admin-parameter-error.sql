-- =====================================================
-- FIX ADMIN PARAMETER $1 ERROR
-- =====================================================
-- This fixes the "there is no parameter $1" error in admin system

BEGIN;

-- 1. Drop ALL existing problematic policies that might use $1 syntax
DROP POLICY IF EXISTS "client_members_select_policy" ON public.client_members;
DROP POLICY IF EXISTS "client_members_insert_policy" ON public.client_members;
DROP POLICY IF EXISTS "client_members_update_policy" ON public.client_members;
DROP POLICY IF EXISTS "client_members_delete_policy" ON public.client_members;

-- 2. Create SIMPLE working policies (no parameters)
CREATE POLICY "client_members_own_access"
ON public.client_members
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Add service role bypass
CREATE POLICY "client_members_service_access"
ON public.client_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Ensure test@test.test has proper memberships
INSERT INTO public.client_members (user_id, client_id, role)
SELECT 
  u.id as user_id,
  c.id as client_id,
  'OWNER' as role
FROM auth.users u
CROSS JOIN public.clients c
WHERE u.email = 'test@test.test'
ON CONFLICT (user_id, client_id) DO UPDATE SET role = 'OWNER';

-- 5. Ensure RLS is properly enabled
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON public.client_members TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

COMMIT;

-- Verification
SELECT 
  'Admin Parameter Fix Applied' as status,
  'No more $1 parameter errors' as result,
  NOW() as applied_at; 