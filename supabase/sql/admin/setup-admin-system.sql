-- ============================================================================
-- OvenAI Admin System Setup
-- ============================================================================
-- This script sets up a simplified admin system with role-based access control
-- Run this script to ensure proper database structure for admin functionality

DO $$
BEGIN
    RAISE NOTICE '🚀 Setting up OvenAI Admin System...';
    RAISE NOTICE '====================================';
    
    -- Check if profiles table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) THEN
        RAISE NOTICE '❌ Profiles table does not exist. Creating...';
        
        CREATE TABLE profiles (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email text UNIQUE NOT NULL,
            full_name text,
            first_name text,
            last_name text,
            role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
            phone text,
            avatar_url text,
            website text,
            created_at timestamptz DEFAULT NOW(),
            updated_at timestamptz DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Profiles table created successfully';
    ELSE
        RAISE NOTICE 'ℹ️  Profiles table already exists';
    END IF;
    
    -- Ensure role column has proper constraints (handle duplicate constraint gracefully)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin'));
        RAISE NOTICE '✅ Role constraint added';
    ELSE
        RAISE NOTICE 'ℹ️  Role constraint already exists';
    END IF;
    
    RAISE NOTICE '🔧 Creating admin helper functions...';
END $$;

-- Create admin helper functions (outside the main DO block)
-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email text)
RETURNS boolean AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID from email
    SELECT id INTO user_id FROM profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found: %', user_email;
        RETURN FALSE;
    END IF;
    
    -- Update user to admin
    UPDATE profiles 
    SET role = 'admin', updated_at = NOW() 
    WHERE id = user_id;
    
    RAISE NOTICE 'User % promoted to admin', user_email;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin rights
CREATE OR REPLACE FUNCTION demote_from_admin(user_email text)
RETURNS boolean AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID from email
    SELECT id INTO user_id FROM profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found: %', user_email;
        RETURN FALSE;
    END IF;
    
    -- Update user to regular user
    UPDATE profiles 
    SET role = 'user', updated_at = NOW() 
    WHERE id = user_id;
    
    RAISE NOTICE 'Admin rights removed from user %', user_email;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies and complete setup
DO $$
BEGIN
    RAISE NOTICE '🔐 Setting up Row Level Security policies...';
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    
    -- Users can view their own profile
    CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
    
    -- Users can update their own profile
    CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
    
    -- Admins can view all profiles
    CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));
    
    -- Admins can update all profiles
    CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));
    
    -- Create indexes for better performance
    RAISE NOTICE '⚡ Creating performance indexes...';
    
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
    
    RAISE NOTICE '✅ Admin system setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary of changes:';
    RAISE NOTICE '  - Profiles table structure verified';
    RAISE NOTICE '  - Admin helper functions created';
    RAISE NOTICE '  - RLS policies configured';
    RAISE NOTICE '  - Performance indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '  1. Create admin user: node scripts/admin/create-admin-user.cjs create';
    RAISE NOTICE '  2. List users: node scripts/admin/create-admin-user.cjs list';
    RAISE NOTICE '  3. Make user admin: node scripts/admin/create-admin-user.cjs make-admin <email>';
    RAISE NOTICE '  4. Remove admin: node scripts/admin/create-admin-user.cjs remove-admin <email>';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Admin Access: Only users with role=''admin'' can access admin console';
END $$;

-- Create trigger for updated_at (outside DO block)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 