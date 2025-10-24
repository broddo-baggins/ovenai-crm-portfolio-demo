import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authService } from '@/integrations/supabase/client';
import { handleAuthError } from '@/lib/supabase';
import { clearAuthCache } from '@/services/base/authWrapper';
import logger from '@/services/base/logger';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Error getting initial session', 'useSupabaseAuth', { error: sessionError });
          console.error('SECURITY Session error:', sessionError);
          
          // Check if it's a refresh token error
          if (handleAuthError(sessionError)) {
            return; // handleAuthError will redirect to login
          }
          
          throw sessionError;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          setIsAuthenticated(true);
          
          console.log(`SECURITY Auth initialized: ${initialSession.user.email} (${initialSession.user.id})`);
        logger.info('Initial session found, user authenticated', 'useSupabaseAuth', { userId: initialSession.user.id });
        } else {
          console.log('SECURITY No initial session found - user needs to login');
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('SECURITY Auth initialization failed:', error);
        logger.error('Error initializing auth', 'useSupabaseAuth', { error });
        
        // Check if it's a refresh token error
        if (handleAuthError(error)) {
          return; // handleAuthError will redirect to login
        }
        
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.info('Auth state changed', 'useSupabaseAuth', { event, userId: newSession?.user?.id });
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setIsAuthenticated(true);
        logger.info('User signed in successfully', 'useSupabaseAuth', { userId: newSession.user.id });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        logger.info('User signed out', 'useSupabaseAuth');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully', 'useSupabaseAuth');
      } else if (event === 'USER_UPDATED') {
        logger.info('User updated', 'useSupabaseAuth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string, provider?: 'google' | 'facebook' | 'fallback') => {
    try {
      setLoading(true);
      console.log(`SECURITY Login attempt: ${email} (provider: ${provider || 'email'})`);
      
      let result;
      if (provider === 'google') {
        console.log('SECURITY Attempting Google OAuth...');
        await authService.signInWithOAuth('google');
        return { success: true };
      } else if (provider === 'facebook') {
        console.log('SECURITY Attempting Facebook OAuth...');
        await authService.signInWithOAuth('facebook');
        return { success: true };
      } else if (provider === 'fallback') {
        console.log('SECURITY Fallback login disabled for security');
        return { success: false, error: 'Fallback login is disabled' };
      } else {
        console.log('SECURITY Attempting email/password login...');
        result = await authService.signIn(email, password);
      }

      if (result?.user) {
        console.log(`SECURITY Login successful: ${result.user.email} (${result.user.id})`);
        
        // Create a proper session object
        const sessionData = {
          user: result.user,
          access_token: result.access_token || '',
          refresh_token: result.refresh_token || '',
          expires_in: result.expires_in || 3600,
          token_type: result.token_type || 'bearer',
          expires_at: result.expires_at || Math.floor(Date.now() / 1000) + 3600
        } as Session;
        
        setSession(sessionData);
        setUser(result.user);
        setIsAuthenticated(true);
        logger.info('Login successful', 'useSupabaseAuth');
        
        // Wait a bit to ensure the state is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Notify other components that user is authenticated
        window.dispatchEvent(new CustomEvent('user-authenticated', {
          detail: { user: result.user }
        }));
        
        return { success: true };
      } else {
        console.error('SECURITY Login failed: No user returned from authService');
        return { success: false, error: 'Login failed - no user returned' };
      }
    } catch (error: any) {
      console.error('SECURITY Login error:', error);
      logger.error('Login failed', 'useSupabaseAuth', { error });
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, {
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
      });

      if (result?.user) {
        setSession({ user: result.user } as Session);
        setUser(result.user);
        setIsAuthenticated(true);
        logger.info('Registration successful', 'useSupabaseAuth');
        return { success: true };
      } else {
        return { success: false, error: 'Registration failed' };
      }
    } catch (error: any) {
      logger.error('Registration failed', 'useSupabaseAuth', { error });
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear local state first to ensure UI updates immediately
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear auth cache
      clearAuthCache();
      
      // Use authService for logout
      await authService.signOut();
      logger.info('Logout successful', 'useSupabaseAuth');
      
    } catch (error) {
      // Even if logout fails, ensure local state is cleared
      logger.error('Logout failed, but local state cleared', 'useSupabaseAuth', { error });
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      clearAuthCache();
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback((requiredRole: string) => {
    if (!user) return false;
    return user.user_metadata?.role === requiredRole;
  }, [user]);

  return {
    user,
    session,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    hasPermission,
  };
};
