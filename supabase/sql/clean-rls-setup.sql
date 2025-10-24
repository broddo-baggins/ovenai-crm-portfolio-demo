-- =============================================
-- CLEAN RLS AND MEMBERSHIP SETUP
-- =============================================
-- This script safely handles existing policies and creates clean setup

BEGIN;

-- =============================================
-- STEP 1: DROP EXISTING POLICIES (if they exist)
-- =============================================

-- Drop client policies
DROP POLICY IF EXISTS "Users can read client memberships they belong to" ON public.client_members;
DROP POLICY IF EXISTS "Users can read clients they have membership in" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients they own" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients they own" ON public.clients;

-- Drop project policies  
DROP POLICY IF EXISTS "Users can read project memberships they belong to" ON public.project_members;
DROP POLICY IF EXISTS "Users can read projects they have membership in" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they own" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects they own" ON public.projects;

-- Drop lead policies
DROP POLICY IF EXISTS "Users can read lead memberships they belong to" ON public.lead_members;
DROP POLICY IF EXISTS "Users can read leads they have membership in" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads they own" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads they own" ON public.leads;

-- Drop conversation policies
DROP POLICY IF EXISTS "Users can read conversation memberships they belong to" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can read conversations they have membership in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they own" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete conversations they own" ON public.conversations;

-- =============================================
-- STEP 2: CREATE MEMBERSHIP TABLES (IF NOT EXISTS)
-- =============================================

-- Client Members Table
CREATE TABLE IF NOT EXISTS public.client_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, user_id)
);

-- Project Members Table  
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Lead Members Table
CREATE TABLE IF NOT EXISTS public.lead_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id, user_id)
);

-- Conversation Members Table
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- =============================================
-- STEP 3: CREATE RLS POLICIES
-- =============================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- CLIENT POLICIES
CREATE POLICY "Users can read clients they have membership in"
    ON public.clients FOR SELECT
    USING (
        id IN (
            SELECT client_id FROM public.client_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create clients"
    ON public.clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update clients they own"
    ON public.clients FOR UPDATE
    USING (
        id IN (
            SELECT client_id FROM public.client_members
            WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete clients they own"
    ON public.clients FOR DELETE
    USING (
        id IN (
            SELECT client_id FROM public.client_members
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- PROJECT POLICIES
CREATE POLICY "Users can read projects they have membership in"
    ON public.projects FOR SELECT
    USING (
        id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update projects they own"
    ON public.projects FOR UPDATE
    USING (
        id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete projects they own"
    ON public.projects FOR DELETE
    USING (
        id IN (
            SELECT project_id FROM public.project_members
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- LEAD POLICIES
CREATE POLICY "Users can read leads they have membership in"
    ON public.leads FOR SELECT
    USING (
        id IN (
            SELECT lead_id FROM public.lead_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create leads"
    ON public.leads FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update leads they own"
    ON public.leads FOR UPDATE
    USING (
        id IN (
            SELECT lead_id FROM public.lead_members
            WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete leads they own"
    ON public.leads FOR DELETE
    USING (
        id IN (
            SELECT lead_id FROM public.lead_members
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- CONVERSATION POLICIES
CREATE POLICY "Users can read conversations they have membership in"
    ON public.conversations FOR SELECT
    USING (
        id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update conversations they own"
    ON public.conversations FOR UPDATE
    USING (
        id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete conversations they own"
    ON public.conversations FOR DELETE
    USING (
        id IN (
            SELECT conversation_id FROM public.conversation_members
            WHERE user_id = auth.uid() AND role = 'OWNER'
        )
    );

-- MEMBERSHIP TABLE POLICIES
CREATE POLICY "Users can read client memberships they belong to"
    ON public.client_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can read project memberships they belong to"
    ON public.project_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can read lead memberships they belong to"
    ON public.lead_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can read conversation memberships they belong to"
    ON public.conversation_members FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- STEP 4: CREATE AUTO-MEMBERSHIP TRIGGERS
-- =============================================

-- Function to create client membership
CREATE OR REPLACE FUNCTION public.create_client_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.client_members (client_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER')
    ON CONFLICT (client_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create project membership
CREATE OR REPLACE FUNCTION public.create_project_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER')
    ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create lead membership
CREATE OR REPLACE FUNCTION public.create_lead_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lead_members (lead_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER')
    ON CONFLICT (lead_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create conversation membership
CREATE OR REPLACE FUNCTION public.create_conversation_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS create_client_membership_trigger ON public.clients;
CREATE TRIGGER create_client_membership_trigger
    AFTER INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.create_client_membership();

DROP TRIGGER IF EXISTS create_project_membership_trigger ON public.projects;
CREATE TRIGGER create_project_membership_trigger
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.create_project_membership();

DROP TRIGGER IF EXISTS create_lead_membership_trigger ON public.leads;
CREATE TRIGGER create_lead_membership_trigger
    AFTER INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.create_lead_membership();

DROP TRIGGER IF EXISTS create_conversation_membership_trigger ON public.conversations;
CREATE TRIGGER create_conversation_membership_trigger
    AFTER INSERT ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.create_conversation_membership();

COMMIT;

-- Test query to verify setup
SELECT 
    'RLS Setup Complete' as status,
    COUNT(*) as total_clients,
    NOW() as timestamp
FROM public.clients; 