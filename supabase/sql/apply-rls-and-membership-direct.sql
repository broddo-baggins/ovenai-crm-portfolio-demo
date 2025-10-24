-- =============================================
-- DIRECT SQL APPLICATION - RUN IN SUPABASE SQL EDITOR
-- =============================================
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- This will create all membership tables and RLS policies

BEGIN;

-- 1. Add missing columns to match Master DB
-- =============================================

-- Add columns to clients table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'description') THEN
        ALTER TABLE public.clients ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'contact_info') THEN
        ALTER TABLE public.clients ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add columns to projects table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'metadata') THEN
        ALTER TABLE public.projects ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add Master DB columns to leads table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'family_name') THEN
        ALTER TABLE public.leads ADD COLUMN family_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'processing_state') THEN
        ALTER TABLE public.leads ADD COLUMN processing_state TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_metadata') THEN
        ALTER TABLE public.leads ADD COLUMN lead_metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'state') THEN
        ALTER TABLE public.leads ADD COLUMN state TEXT DEFAULT 'new';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'bant_status') THEN
        ALTER TABLE public.leads ADD COLUMN bant_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'state_status_metadata') THEN
        ALTER TABLE public.leads ADD COLUMN state_status_metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'first_interaction') THEN
        ALTER TABLE public.leads ADD COLUMN first_interaction TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_interaction') THEN
        ALTER TABLE public.leads ADD COLUMN last_interaction TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'interaction_count') THEN
        ALTER TABLE public.leads ADD COLUMN interaction_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'next_follow_up') THEN
        ALTER TABLE public.leads ADD COLUMN next_follow_up TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'follow_up_count') THEN
        ALTER TABLE public.leads ADD COLUMN follow_up_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'requires_human_review') THEN
        ALTER TABLE public.leads ADD COLUMN requires_human_review BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_agent_processed_at') THEN
        ALTER TABLE public.leads ADD COLUMN last_agent_processed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Skip status constraint for now - will be applied separately
-- to avoid conflicts with existing data

-- 2. Create membership tables
-- =============================================

-- Client membership table
CREATE TABLE IF NOT EXISTS public.client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- Project membership table  
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Lead membership table
CREATE TABLE IF NOT EXISTS public.lead_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, user_id)
);

-- Conversation membership table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_client_members_client_user ON public.client_members(client_id, user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user ON public.client_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_members_lead_user ON public.lead_members(lead_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lead_members_user ON public.lead_members(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_user ON public.conversation_members(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);

-- 4. Auto-membership triggers
-- =============================================

-- Function to add owner membership
CREATE OR REPLACE FUNCTION public.add_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only add membership if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'clients' THEN
        INSERT INTO public.client_members (client_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (client_id, user_id) DO NOTHING;
        
      WHEN 'projects' THEN
        INSERT INTO public.project_members (project_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
      WHEN 'leads' THEN
        INSERT INTO public.lead_members (lead_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (lead_id, user_id) DO NOTHING;
        
      WHEN 'conversations' THEN
        INSERT INTO public.conversation_members (conversation_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for auto-membership
DROP TRIGGER IF EXISTS add_owner_membership_clients_trg ON public.clients;
CREATE TRIGGER add_owner_membership_clients_trg
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_projects_trg ON public.projects;
CREATE TRIGGER add_owner_membership_projects_trg
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_leads_trg ON public.leads;
CREATE TRIGGER add_owner_membership_leads_trg
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_conversations_trg ON public.conversations;
CREATE TRIGGER add_owner_membership_conversations_trg
  AFTER INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

-- 5. Enable RLS on all tables
-- =============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR CLIENTS
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert new clients" ON public.clients;

-- Read policy
CREATE POLICY "Users can read their clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = clients.id
      AND cm.user_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Users can update their clients"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = clients.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Delete policy
CREATE POLICY "Users can delete their clients"
ON public.clients
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = clients.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy - will be validated by trigger
CREATE POLICY "Users can insert new clients"
ON public.clients
FOR INSERT
WITH CHECK (true); -- Trigger will handle membership

-- 7. RLS POLICIES FOR PROJECTS
-- =============================================

DROP POLICY IF EXISTS "Users can read their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert new projects" ON public.projects;

-- Read policy
CREATE POLICY "Users can read their projects"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Users can update their projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Delete policy
CREATE POLICY "Users can delete their projects"
ON public.projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new projects"
ON public.projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
  )
);

-- 8. RLS POLICIES FOR LEADS
-- =============================================

DROP POLICY IF EXISTS "Users can read their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert new leads" ON public.leads;

-- Read policy (through project or direct membership)
CREATE POLICY "Users can read their leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = leads.id
      AND lm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Users can update their leads"
ON public.leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = leads.id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Delete policy
CREATE POLICY "Users can delete their leads"
ON public.leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = leads.id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new leads"
ON public.leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
  )
  OR
  (leads.current_project_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
  ))
);

-- 9. RLS POLICIES FOR CONVERSATIONS
-- =============================================

DROP POLICY IF EXISTS "Users can read their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert new conversations" ON public.conversations;

-- Read policy (through lead membership)
CREATE POLICY "Users can read their conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = conversations.lead_id
      AND lm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = conversations.lead_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
      AND clm.role IN ('OWNER', 'ADMIN')
  )
);

-- Delete policy
CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.lead_members lm
    WHERE lm.lead_id = conversations.lead_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
      AND clm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
  )
);

-- 10. RLS POLICIES FOR MEMBERSHIP TABLES
-- =============================================

-- Client members
CREATE POLICY "Users can read client memberships they belong to"
ON public.client_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.client_members cm2 
  WHERE cm2.client_id = client_members.client_id 
    AND cm2.user_id = auth.uid() 
    AND cm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can manage client memberships"
ON public.client_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.client_members cm 
  WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

CREATE POLICY "Owners can update client memberships"
ON public.client_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.client_members cm 
  WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

CREATE POLICY "Owners can delete client memberships"
ON public.client_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.client_members cm 
  WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

-- Project members
CREATE POLICY "Users can read project memberships they belong to"
ON public.project_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.project_members pm2 
  WHERE pm2.project_id = project_members.project_id 
    AND pm2.user_id = auth.uid() 
    AND pm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can insert project memberships"
ON public.project_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role = 'OWNER'
));

CREATE POLICY "Owners can update project memberships"
ON public.project_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role = 'OWNER'
));

CREATE POLICY "Owners can delete project memberships"
ON public.project_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role = 'OWNER'
));

-- Lead members
CREATE POLICY "Users can read lead memberships they belong to"
ON public.lead_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.lead_members lm2 
  WHERE lm2.lead_id = lead_members.lead_id 
    AND lm2.user_id = auth.uid() 
    AND lm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can insert lead memberships"
ON public.lead_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.lead_members lm 
  WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = auth.uid() 
    AND lm.role = 'OWNER'
));

CREATE POLICY "Owners can update lead memberships"
ON public.lead_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.lead_members lm 
  WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = auth.uid() 
    AND lm.role = 'OWNER'
));

CREATE POLICY "Owners can delete lead memberships"
ON public.lead_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.lead_members lm 
  WHERE lm.lead_id = lead_members.lead_id 
    AND lm.user_id = auth.uid() 
    AND lm.role = 'OWNER'
));

-- Conversation members
CREATE POLICY "Users can read conversation memberships they belong to"
ON public.conversation_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.conversation_members cm2 
  WHERE cm2.conversation_id = conversation_members.conversation_id 
    AND cm2.user_id = auth.uid() 
    AND cm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can insert conversation memberships"
ON public.conversation_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

CREATE POLICY "Owners can update conversation memberships"
ON public.conversation_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

CREATE POLICY "Owners can delete conversation memberships"
ON public.conversation_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

-- 11. Grant permissions
-- =============================================

GRANT ALL ON public.client_members TO authenticated;
GRANT ALL ON public.project_members TO authenticated;
GRANT ALL ON public.lead_members TO authenticated;
GRANT ALL ON public.conversation_members TO authenticated;

-- Grant permissions on membership tables to service role for admin operations
GRANT ALL ON public.client_members TO service_role;
GRANT ALL ON public.project_members TO service_role;
GRANT ALL ON public.lead_members TO service_role;
GRANT ALL ON public.conversation_members TO service_role;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Post-deployment verification queries
-- =============================================

-- Check that membership tables were created
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
    AND table_name LIKE '%_members' 
ORDER BY table_name;

-- Check that new columns were added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'projects', 'leads')
    AND column_name IN ('description', 'contact_info', 'metadata', 'family_name', 'processing_state', 'lead_metadata')
ORDER BY table_name, column_name;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('clients', 'projects', 'leads', 'conversations', 'client_members', 'project_members', 'lead_members', 'conversation_members')
ORDER BY tablename; 