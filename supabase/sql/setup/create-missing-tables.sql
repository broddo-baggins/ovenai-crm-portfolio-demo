-- Create missing tables for OvenAI CRM
-- This script fixes the critical database schema issues

-- 1. Create profiles table (auth system expects this)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create client_members table (projects/leads queries depend on this)
CREATE TABLE IF NOT EXISTS public.client_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, client_id)
);

-- Enable RLS on client_members
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.client_members;
DROP POLICY IF EXISTS "Users can manage their own memberships" ON public.client_members;

-- Create RLS policies for client_members
CREATE POLICY "Users can view their own memberships" ON public.client_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own memberships" ON public.client_members
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_members_user_id ON public.client_members(user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_client_id ON public.client_members(client_id);

-- 3. Create test user relationships if test user exists
DO $$
DECLARE
    test_user_id UUID;
    test_client_id UUID;
BEGIN
    -- Get test user ID
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@test.test';
    
    -- Get test client ID
    SELECT id INTO test_client_id 
    FROM public.clients 
    WHERE name = 'Test Client Company';
    
    -- If both exist, create relationships
    IF test_user_id IS NOT NULL AND test_client_id IS NOT NULL THEN
        -- Create profile for test user
        INSERT INTO public.profiles (id, full_name, updated_at)
        VALUES (test_user_id, 'Test User', NOW())
        ON CONFLICT (id) DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            updated_at = EXCLUDED.updated_at;
        
        -- Create client membership for test user
        INSERT INTO public.client_members (user_id, client_id, role, updated_at)
        VALUES (test_user_id, test_client_id, 'admin', NOW())
        ON CONFLICT (user_id, client_id) DO UPDATE SET 
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
            
        RAISE NOTICE 'Test user relationships created successfully';
    ELSE
        RAISE NOTICE 'Test user or client not found - skipping relationship creation';
    END IF;
END
$$;

-- 4. Verify tables were created
SELECT 
    'Tables created successfully' as result,
    COUNT(*) as profile_count
FROM public.profiles;

SELECT 
    'Client memberships table ready' as result,
    COUNT(*) as membership_count
FROM public.client_members; 