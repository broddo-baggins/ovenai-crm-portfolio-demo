-- =============================================
-- RLS PERFORMANCE OPTIMIZATION
-- =============================================
-- 
-- This script fixes RLS performance issues by replacing auth.<function>() 
-- with (select auth.<function>()) to prevent per-row evaluation.
--
-- Based on Supabase database linter recommendations:
-- https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

-- Drop all existing RLS policies to recreate them with performance optimization
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL existing policies
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    RAISE NOTICE 'Dropped all existing RLS policies for performance optimization';
END $$;

-- =============================================
-- CLIENT_MEMBERS TABLE POLICIES (OPTIMIZED)
-- =============================================

-- Enable RLS
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- SELECT policy - Users can view their own memberships
CREATE POLICY "client_members_select_policy"
ON public.client_members
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- INSERT policy - Users can create memberships for themselves
CREATE POLICY "Owners can insert client memberships"
ON public.client_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.client_members cm 
    WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- UPDATE policy - Users can update their own memberships or owners can manage
CREATE POLICY "Owners can update client memberships"
ON public.client_members
FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.client_members cm 
    WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
)
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.client_members cm 
    WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- DELETE policy - Users can delete their own memberships or owners can manage
CREATE POLICY "Owners can delete client memberships"
ON public.client_members
FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.client_members cm 
    WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- Special policy for users deleting their own memberships
CREATE POLICY "Users can delete their own memberships"
ON public.client_members
FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- Service role bypass
CREATE POLICY "Service role can manage client memberships"
ON public.client_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- CONVERSATION_MEMBERS TABLE POLICIES (OPTIMIZED)
-- =============================================

-- Enable RLS
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view their conversation memberships"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- INSERT policy
CREATE POLICY "Owners can insert conversation memberships"
ON public.conversation_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.conversation_members cm 
    WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- UPDATE policy
CREATE POLICY "Owners can update conversation memberships"
ON public.conversation_members
FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.conversation_members cm 
    WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
)
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.conversation_members cm 
    WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- DELETE policy
CREATE POLICY "Owners can delete conversation memberships"
ON public.conversation_members
FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.conversation_members cm 
    WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  )
);

-- =============================================
-- LEAD_MEMBERS TABLE POLICIES (OPTIMIZED)
-- =============================================

-- Enable RLS
ALTER TABLE public.lead_members ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view their lead memberships"
ON public.lead_members
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- INSERT policy
CREATE POLICY "Owners can insert lead memberships"
ON public.lead_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.lead_members lm 
    WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = (select auth.uid()) 
    AND lm.role = 'OWNER'
  )
);

-- UPDATE policy
CREATE POLICY "Owners can update lead memberships"
ON public.lead_members
FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.lead_members lm 
    WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = (select auth.uid()) 
    AND lm.role = 'OWNER'
  )
)
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.lead_members lm 
    WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = (select auth.uid()) 
    AND lm.role = 'OWNER'
  )
);

-- DELETE policy
CREATE POLICY "Owners can delete lead memberships"
ON public.lead_members
FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.lead_members lm 
    WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = (select auth.uid()) 
    AND lm.role = 'OWNER'
  )
);

-- =============================================
-- PROJECT_MEMBERS TABLE POLICIES (OPTIMIZED)
-- =============================================

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view their project memberships"
ON public.project_members
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- INSERT policy
CREATE POLICY "Owners can insert project memberships"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = (select auth.uid()) 
    AND pm.role = 'OWNER'
  )
);

-- UPDATE policy
CREATE POLICY "Owners can update project memberships"
ON public.project_members
FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = (select auth.uid()) 
    AND pm.role = 'OWNER'
  )
)
WITH CHECK (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = (select auth.uid()) 
    AND pm.role = 'OWNER'
  )
);

-- DELETE policy
CREATE POLICY "Owners can delete project memberships"
ON public.project_members
FOR DELETE
TO authenticated
USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = (select auth.uid()) 
    AND pm.role = 'OWNER'
  )
);

-- =============================================
-- SYNC_LOGS TABLE POLICIES (OPTIMIZED)
-- =============================================

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage sync logs
CREATE POLICY "Service role can manage sync logs"
ON public.sync_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read sync logs related to their data
CREATE POLICY "Users can read relevant sync logs"
ON public.sync_logs
FOR SELECT
TO authenticated
USING (
  (select auth.role()) = 'service_role' OR
  user_id = (select auth.uid())
);

-- =============================================
-- MAIN DATA TABLE POLICIES (OPTIMIZED)
-- =============================================

-- CLIENTS table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert new clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true); -- Trigger will handle membership

CREATE POLICY "Users can update their clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Users can delete clients they own"
ON public.clients
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  )
);

CREATE POLICY "Users can delete their clients"
ON public.clients
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  )
);

-- PROJECTS table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  ) OR
  id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert new projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update accessible projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('OWNER', 'ADMIN')
  ) OR
  id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Users can delete projects they own"
ON public.projects
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  ) OR
  id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  )
);

-- LEADS table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  ) OR
  current_project_id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = (select auth.uid())
  ) OR
  id IN (
    SELECT lead_id 
    FROM public.lead_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert new leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update accessible leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  ) OR
  current_project_id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = (select auth.uid())
  ) OR
  id IN (
    SELECT lead_id 
    FROM public.lead_members 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Users can delete leads they own"
ON public.leads
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  ) OR
  id IN (
    SELECT lead_id 
    FROM public.lead_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  )
);

CREATE POLICY "Users can delete their leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = (select auth.uid())
  )
);

-- CONVERSATIONS table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    JOIN public.client_members cm ON cm.client_id = l.client_id
    WHERE cm.user_id = (select auth.uid())
  ) OR
  id IN (
    SELECT conversation_id 
    FROM public.conversation_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can insert new conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    JOIN public.client_members cm ON cm.client_id = l.client_id
    WHERE cm.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update accessible conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    JOIN public.client_members cm ON cm.client_id = l.client_id
    WHERE cm.user_id = (select auth.uid())
  ) OR
  id IN (
    SELECT conversation_id 
    FROM public.conversation_members 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Users can delete conversations they own"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    JOIN public.client_members cm ON cm.client_id = l.client_id
    WHERE cm.user_id = (select auth.uid()) 
    AND cm.role = 'OWNER'
  ) OR
  id IN (
    SELECT conversation_id 
    FROM public.conversation_members 
    WHERE user_id = (select auth.uid()) 
    AND role = 'OWNER'
  )
);

CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  lead_id IN (
    SELECT l.id 
    FROM public.leads l
    JOIN public.client_members cm ON cm.client_id = l.client_id
    WHERE cm.user_id = (select auth.uid())
  )
);

-- =============================================
-- USER PERFORMANCE TARGETS (OPTIMIZED)
-- =============================================

-- Enable RLS if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_performance_targets') THEN
        ALTER TABLE public.user_performance_targets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage their own performance targets"
        ON public.user_performance_targets
        FOR ALL
        TO authenticated
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
        
        CREATE POLICY "Users can delete their own performance targets"
        ON public.user_performance_targets
        FOR DELETE
        TO authenticated
        USING (user_id = (select auth.uid()));
    END IF;
END $$;

-- =============================================
-- SERVICE ROLE BYPASS POLICIES
-- =============================================

-- Add service role bypass for all main tables
CREATE POLICY "Service role full access clients"
ON public.clients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access projects"
ON public.projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access leads"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access conversations"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- =============================================
-- VERIFICATION
-- =============================================

-- Create a view to monitor RLS performance
CREATE OR REPLACE VIEW public.rls_performance_monitor AS
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN 'PERFORMANCE_ISSUE'
    WHEN qual LIKE '%(select auth.uid())%' THEN 'OPTIMIZED'
    ELSE 'OK'
  END as performance_status,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN 1
    ELSE 2
  END,
  tablename, 
  policyname;

-- Grant view access
GRANT SELECT ON public.rls_performance_monitor TO authenticated, service_role;

-- Report optimization results
SELECT 
  'RLS Performance Optimization Complete' as status,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN performance_status = 'OPTIMIZED' THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN performance_status = 'PERFORMANCE_ISSUE' THEN 1 END) as issues_remaining
FROM public.rls_performance_monitor;

-- Show any remaining issues
SELECT * FROM public.rls_performance_monitor 
WHERE performance_status = 'PERFORMANCE_ISSUE'; 