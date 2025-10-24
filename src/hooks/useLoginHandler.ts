// This file is deprecated and should be removed as we're using Supabase auth directly
// Keeping a simplified version to prevent import errors in case it's still referenced somewhere

import { useState } from 'react';
import { toast } from "sonner";
import { FALLBACK_LOGIN_ENABLED } from '@/lib/config';
import { debug } from '@/utils/debug';

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    clientId: string;
    clientName?: string;
    name?: string;
    role?: string;
    status?: string;
  };
}

export const useLoginHandler = () => {
  const [loading, setLoading] = useState(false);
  
  // This is a stub implementation since we're using Supabase auth directly
  const login = async (): Promise<LoginResponse> => {
    setLoading(true);
    debug.log('useLoginHandler is deprecated - using Supabase auth directly instead');
    
    try {
      // This should never be called in production
      throw new Error('This auth method is deprecated. Use Supabase auth directly.');
    } catch (error: unknown) {
      debug.error('Deprecated login handler error:', error);
      toast.error('Authentication error: Using deprecated login handler');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    apiReachable: true, // Always return true to prevent error handling based on this value
    allowFallbackLogin: FALLBACK_LOGIN_ENABLED
  };
};
