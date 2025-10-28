import { 
  BarChart3,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Briefcase,
  HelpCircle,
  Shield,
  Building2,
} from 'lucide-react';

// Helper function to check if user is admin (legacy system admin check)
const isUserAdmin = (user?: any) => {
  if (!user) return false;
  
  // Check user metadata for admin status
  const isAdminFromMetadata = user.user_metadata?.role === 'admin' || 
                              user.user_metadata?.is_admin === true;
  
  // If we have profile data, check that too
  const isAdminFromProfile = user.profile?.role === 'admin';
  
  return isAdminFromMetadata || isAdminFromProfile;
};

interface AdminAccess {
  isSystemAdmin: boolean;
  isCompanyAdmin: boolean;
}

export const getNavItems = (
  t: (key: string, options?: any) => string, 
  user?: any,
  adminAccess?: AdminAccess
) => [
  { 
    path: "/dashboard", 
    name: t('navigation.dashboard', 'Dashboard'), 
    icon: BarChart3 
  },
  { 
    path: "/leads", 
    name: t('navigation.leads', 'Leads'), 
    icon: Users 
  },
  { 
    path: "/projects", 
    name: t('navigation.projects', 'Projects'), 
    icon: Briefcase 
  },
  { 
    path: "/lead-pipeline", 
    name: t('navigation.templates', 'Templates'), 
    icon: FileText 
  },
  { 
    path: "/calendar", 
    name: t('navigation.calendar', 'Calendar'), 
    icon: Calendar 
  },
  { 
    path: "/messages", 
    name: t('navigation.messages', 'Messages'), 
    icon: MessageSquare 
  },
  { 
    path: "/reports", 
    name: t('navigation.reports', 'Reports'), 
    icon: FileText 
  },
  { 
    path: "/settings", 
    name: t('navigation.settings', 'Settings'), 
    icon: Settings 
  },
  { 
    path: "/faq", 
    name: t('navigation.help', 'Help & FAQ'), 
    icon: HelpCircle 
  },
  // Admin Center (for any admin - system or company)
  ...(adminAccess?.isSystemAdmin || adminAccess?.isCompanyAdmin || isUserAdmin(user) ? [
    { 
      path: "/admin", 
      name: t('navigation.adminCenter', 'Admin Center'), 
      icon: Shield 
    },
    { 
      path: "/users", 
      name: t('navigation.users', 'Users'), 
      icon: Users 
    },
  ] : []),
]; 