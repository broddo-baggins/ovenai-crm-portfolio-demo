-- 🔒 SECURE ROW LEVEL SECURITY SETUP
-- This script sets up proper RLS policies so each user only sees their client's data

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their clients" ON clients;
DROP POLICY IF EXISTS "Users can edit their clients" ON clients;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can edit their projects" ON projects;
DROP POLICY IF EXISTS "Users can view their leads" ON leads;
DROP POLICY IF EXISTS "Users can edit their leads" ON leads;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can edit their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their client memberships" ON client_members;
DROP POLICY IF EXISTS "Users can manage their client memberships" ON client_members;
DROP POLICY IF EXISTS "Users can view their project memberships" ON project_members;
DROP POLICY IF EXISTS "Users can manage their project memberships" ON project_members;

-- CLIENT POLICIES: Users can only see clients they're members of
CREATE POLICY "Users can view their clients" ON clients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = clients.id 
    AND client_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their clients" ON clients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = clients.id 
    AND client_members.user_id = auth.uid()
    AND client_members.role IN ('OWNER', 'ADMIN')
  )
);

-- PROJECT POLICIES: Users can only see projects in their clients
CREATE POLICY "Users can view their projects" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = projects.client_id 
    AND client_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their projects" ON projects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = projects.client_id 
    AND client_members.user_id = auth.uid()
    AND client_members.role IN ('OWNER', 'ADMIN')
  )
);

-- LEAD POLICIES: Users can only see leads in their clients
CREATE POLICY "Users can view their leads" ON leads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = leads.client_id 
    AND client_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their leads" ON leads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM client_members 
    WHERE client_members.client_id = leads.client_id 
    AND client_members.user_id = auth.uid()
  )
);

-- CONVERSATION POLICIES: Users can only see conversations in their projects
CREATE POLICY "Users can view their conversations" ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN client_members cm ON cm.client_id = p.client_id
    WHERE p.id = conversations.project_id 
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their conversations" ON conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN client_members cm ON cm.client_id = p.client_id
    WHERE p.id = conversations.project_id 
    AND cm.user_id = auth.uid()
  )
);

-- CLIENT MEMBERSHIP POLICIES
CREATE POLICY "Users can view their client memberships" ON client_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their client memberships" ON client_members
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM client_members cm
    WHERE cm.client_id = client_members.client_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'OWNER'
  )
);

-- PROJECT MEMBERSHIP POLICIES
CREATE POLICY "Users can view their project memberships" ON project_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their project memberships" ON project_members
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM projects p
    JOIN client_members cm ON cm.client_id = p.client_id
    WHERE p.id = project_members.project_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('OWNER', 'ADMIN')
  )
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to assign user to default client (for test@test.test)
CREATE OR REPLACE FUNCTION assign_user_to_default_client()
RETURNS TRIGGER AS $$
BEGIN
  -- For test@test.test, assign to all clients as OWNER
  IF NEW.email = 'test@test.test' THEN
    INSERT INTO client_members (user_id, client_id, role, created_at)
    SELECT NEW.id, c.id, 'OWNER', NOW()
    FROM clients c
    ON CONFLICT (user_id, client_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign users to clients
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_user_to_default_client();

-- Insert test@test.test user if not exists and assign to all clients
DO $$
DECLARE
  test_user_id UUID;
  client_record RECORD;
BEGIN
  -- Insert or get test user
  INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(), 
    'test@test.test', 
    NOW(), 
    NOW(), 
    NOW(), 
    'authenticated', 
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO test_user_id;
  
  -- If no id returned, get existing user
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@test.test';
  END IF;
  
  -- Assign to all clients
  FOR client_record IN SELECT id FROM clients LOOP
    INSERT INTO client_members (user_id, client_id, role, created_at)
    VALUES (test_user_id, client_record.id, 'OWNER', NOW())
    ON CONFLICT (user_id, client_id) DO NOTHING;
  END LOOP;
END $$; 