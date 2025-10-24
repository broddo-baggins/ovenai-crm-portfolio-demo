
import { API_URL } from '@/lib/config';

interface User {
  id: string;
  email: string;
  clientId: string;
  clientName?: string;
  name?: string;
  role?: string;
  status?: string;
}

export const useAuthUtils = (user: User | null, accessToken: string | null) => {
  const hasPermission = (roles: string[]) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const logout = async () => {
    try {
      if (accessToken) {
        // Call logout API if needed
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }).catch(e => console.error('Logout API error:', e));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  return {
    hasPermission,
    logout
  };
};
