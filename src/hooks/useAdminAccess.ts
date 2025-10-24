import { useState, useEffect } from 'react';
import { useAuth } from '@/context/ClientAuthContext';
import { supabase } from '@/lib/supabase';

export interface AdminAccessInfo {
  isSystemAdmin: boolean;
  isCompanyAdmin: boolean;
  isAdmin: boolean; // backwards compatibility - true if either system or company admin
  isLoading: boolean;
  permissions: string[];
  companyAdminClients: string[]; // list of client IDs where user is admin
  error?: string;
  checkAdminAccess?: () => Promise<void>;
}

const SYSTEM_ADMIN_PERMISSIONS = [
  'system:full_access',
  'database:read_write',
  'users:manage',
  'logs:view',
  'console:execute',
  'admin:create',
  'settings:modify',
  'clients:manage_all',
  'system:monitor'
];

const COMPANY_ADMIN_PERMISSIONS = [
  'company:manage_users',
  'company:manage_projects',
  'company:view_reports',
  'company:manage_settings',
  'users:invite',
  'users:deactivate'
];

const USER_PERMISSIONS: string[] = [];

export function useAdminAccess(): AdminAccessInfo {
  const { user, loading: authLoading } = useAuth();
  const [adminInfo, setAdminInfo] = useState<AdminAccessInfo>({
    isSystemAdmin: false,
    isCompanyAdmin: false,
    isAdmin: false,
    isLoading: true,
    permissions: [],
    companyAdminClients: []
  });

  const checkAdminAccess = async () => {
    if (!user) {
      setAdminInfo({
        isSystemAdmin: false,
        isCompanyAdmin: false,
        isAdmin: false,
        isLoading: false,
        permissions: [],
        companyAdminClients: []
      });
      return;
    }

    try {
      // Check user profile for system admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, status')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Check if user is system admin
      let isSystemAdmin = false;
      if (profile) {
        // System admin check - only role === 'admin' grants full system access
        isSystemAdmin = profile.role === 'admin';
      }

      // Check user metadata as fallback for system admin
      if (!isSystemAdmin && user.user_metadata) {
        isSystemAdmin = user.user_metadata.role === 'admin' || 
                       user.user_metadata.is_admin === true;
      }

      // Check for company admin roles using type-safe query
      let companyAdminClients: string[] = [];
      let isCompanyAdmin = false;
      
      try {
        // Use a type assertion to handle client_members table which isn't in generated types
        const { data: clientMemberships, error: membershipError } = await (supabase as any)
          .from('client_members')
          .select('client_id, role')
          .eq('user_id', user.id)
          .in('role', ['OWNER', 'ADMIN']);

        if (!membershipError && clientMemberships) {
          companyAdminClients = clientMemberships.map((m: any) => m.client_id);
          isCompanyAdmin = companyAdminClients.length > 0;
        }
      } catch (membershipError) {
        console.warn('WARNING Could not check company admin roles:', membershipError);
        // If we can't check company memberships, default to false
        // This allows the system to work even if client_members table has issues
      }

      // Determine permissions based on admin levels
      let permissions: string[] = [];
      if (isSystemAdmin) {
        permissions = [...SYSTEM_ADMIN_PERMISSIONS];
      } else if (isCompanyAdmin) {
        permissions = [...COMPANY_ADMIN_PERMISSIONS];
      } else {
        permissions = [...USER_PERMISSIONS];
      }

      setAdminInfo({
        isSystemAdmin,
        isCompanyAdmin,
        isAdmin: isSystemAdmin || isCompanyAdmin, // backwards compatibility
        isLoading: false,
        permissions,
        companyAdminClients
      });
    } catch (error) {
      console.error('Error checking admin access:', error);
      setAdminInfo({
        isSystemAdmin: false,
        isCompanyAdmin: false,
        isAdmin: false,
        isLoading: false,
        permissions: [],
        companyAdminClients: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  return {
    ...adminInfo,
    checkAdminAccess
  };
}

export function useAdminPermission(permission: string): boolean {
  const { permissions } = useAdminAccess();
  return permissions.includes(permission);
}

export function useIsSystemAdmin(): boolean {
  const { isSystemAdmin } = useAdminAccess();
  return isSystemAdmin;
}

export function useIsCompanyAdmin(): boolean {
  const { isCompanyAdmin } = useAdminAccess();
  return isCompanyAdmin;
}

// Backwards compatibility
export function useIsAdmin(): boolean {
  const { isAdmin } = useAdminAccess();
  return isAdmin;
} 