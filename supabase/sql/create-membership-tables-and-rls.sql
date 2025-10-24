-- =============================================
-- MEMBERSHIP TABLES AND RLS POLICIES
-- =============================================

-- 1. Create membership tables
-- =============================================

-- Client membership table
CREATE TABLE IF NOT EXISTS client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- Project membership table  
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Lead membership (through project)
CREATE TABLE IF NOT EXISTS lead_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, user_id)
);

-- Conversation membership (through lead)
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 2. Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_client_members_client_user ON client_members(client_id, user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user ON client_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_members_lead_user ON lead_members(lead_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lead_members_user ON lead_members(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_user ON conversation_members(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);

-- 3. Auto-membership triggers
-- =============================================

-- Function to add owner membership
CREATE OR REPLACE FUNCTION add_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only add membership if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'clients' THEN
        INSERT INTO client_members (client_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (client_id, user_id) DO NOTHING;
        
      WHEN 'projects' THEN
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
      WHEN 'leads' THEN
        INSERT INTO lead_members (lead_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (lead_id, user_id) DO NOTHING;
        
      WHEN 'conversations' THEN
        INSERT INTO conversation_members (conversation_id, user_id, role)
        VALUES (NEW.id, auth.uid(), 'OWNER')
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for auto-membership
DROP TRIGGER IF EXISTS add_owner_membership_clients_trg ON clients;
CREATE TRIGGER add_owner_membership_clients_trg
  AFTER INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_projects_trg ON projects;
CREATE TRIGGER add_owner_membership_projects_trg
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_leads_trg ON leads;
CREATE TRIGGER add_owner_membership_leads_trg
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION add_owner_membership();

DROP TRIGGER IF EXISTS add_owner_membership_conversations_trg ON conversations;
CREATE TRIGGER add_owner_membership_conversations_trg
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION add_owner_membership();

-- 4. RLS POLICIES FOR CLIENTS
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their clients" ON clients;
DROP POLICY IF EXISTS "Users can update/delete their clients" ON clients;
DROP POLICY IF EXISTS "Users can insert new clients" ON clients;

-- Read policy
CREATE POLICY "Users can read their clients"
ON clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = clients.id
      AND cm.user_id = auth.uid()
  )
);

-- Update/Delete policy
CREATE POLICY "Users can update/delete their clients"
ON clients
FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = clients.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy - will be validated by trigger
CREATE POLICY "Users can insert new clients"
ON clients
FOR INSERT
WITH CHECK (true); -- Trigger will handle membership

-- 5. RLS POLICIES FOR PROJECTS
-- =============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their projects" ON projects;
DROP POLICY IF EXISTS "Users can update/delete their projects" ON projects;
DROP POLICY IF EXISTS "Users can insert new projects" ON projects;

-- Read policy
CREATE POLICY "Users can read their projects"
ON projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
  )
);

-- Update/Delete policy
CREATE POLICY "Users can update/delete their projects"
ON projects
FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new projects"
ON projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = projects.client_id
      AND cm.user_id = auth.uid()
  )
);

-- 6. RLS POLICIES FOR LEADS
-- =============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their leads" ON leads;
DROP POLICY IF EXISTS "Users can update/delete their leads" ON leads;
DROP POLICY IF EXISTS "Users can insert new leads" ON leads;

-- Read policy (through project or direct membership)
CREATE POLICY "Users can read their leads"
ON leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM lead_members lm
    WHERE lm.lead_id = leads.id
      AND lm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
  )
);

-- Update/Delete policy
CREATE POLICY "Users can update/delete their leads"
ON leads
FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1
    FROM lead_members lm
    WHERE lm.lead_id = leads.id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new leads"
ON leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM client_members cm
    WHERE cm.client_id = leads.client_id
      AND cm.user_id = auth.uid()
  )
  OR
  (leads.current_project_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = leads.current_project_id
      AND pm.user_id = auth.uid()
  ))
);

-- 7. RLS POLICIES FOR CONVERSATIONS
-- =============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update/delete their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert new conversations" ON conversations;

-- Read policy (through lead membership)
CREATE POLICY "Users can read their conversations"
ON conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM lead_members lm
    WHERE lm.lead_id = conversations.lead_id
      AND lm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
  )
);

-- Update/Delete policy
CREATE POLICY "Users can update/delete their conversations"
ON conversations
FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM lead_members lm
    WHERE lm.lead_id = conversations.lead_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('OWNER', 'ADMIN')
  )
  OR
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
      AND clm.role IN ('OWNER', 'ADMIN')
  )
);

-- Insert policy
CREATE POLICY "Users can insert new conversations"
ON conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN client_members clm ON clm.client_id = l.client_id
    WHERE l.id = conversations.lead_id
      AND clm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM leads l
    JOIN project_members pm ON pm.project_id = l.current_project_id
    WHERE l.id = conversations.lead_id
      AND pm.user_id = auth.uid()
  )
);

-- 8. RLS POLICIES FOR MEMBERSHIP TABLES
-- =============================================

-- Client members
ALTER TABLE client_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read client memberships they belong to"
ON client_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM client_members cm2 
  WHERE cm2.client_id = client_members.client_id 
    AND cm2.user_id = auth.uid() 
    AND cm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can manage client memberships"
ON client_members
FOR INSERT, UPDATE, DELETE
USING (EXISTS (
  SELECT 1 FROM client_members cm 
  WHERE cm.client_id = client_members.client_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'OWNER'
));

-- Project members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read project memberships they belong to"
ON project_members
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM project_members pm2 
  WHERE pm2.project_id = project_members.project_id 
    AND pm2.user_id = auth.uid() 
    AND pm2.role IN ('OWNER', 'ADMIN')
));

CREATE POLICY "Owners can manage project memberships"
ON project_members
FOR INSERT, UPDATE, DELETE
USING (EXISTS (
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role = 'OWNER'
));

-- Similar policies for lead_members and conversation_members
ALTER TABLE lead_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON client_members TO authenticated;
GRANT ALL ON project_members TO authenticated;
GRANT ALL ON lead_members TO authenticated;
GRANT ALL ON conversation_members TO authenticated;

-- Grant permissions on membership tables to service role for admin operations
GRANT ALL ON client_members TO service_role;
GRANT ALL ON project_members TO service_role;
GRANT ALL ON lead_members TO service_role;
GRANT ALL ON conversation_members TO service_role;

COMMIT; 