/**
 * Auth Wrapper for Service Calls
 * Ensures authentication session is available before executing service methods
 */

import { supabase } from '@/integrations/supabase/client';

// Cache for session validation
let lastSessionCheck = 0;
let cachedSession: any = null;
const SESSION_CHECK_INTERVAL = 5000; // 5 seconds

/**
 * Ensures a valid auth session exists before executing the callback
 * @param callback The function to execute after session validation
 * @param retryCount Number of retries if session not immediately available
 * @returns The result of the callback
 */
export async function withAuth<T>(
  callback: () => Promise<T>, 
  retryCount = 3
): Promise<T> {
  const now = Date.now();
  
  // Check if we need to refresh the session check
  if (now - lastSessionCheck > SESSION_CHECK_INTERVAL || !cachedSession) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('SECURITY Session check error:', error);
        throw new Error(`AuthSessionMissingError: ${error.message}`);
      }
      
      cachedSession = session;
      lastSessionCheck = now;
    } catch (error) {
      console.error('SECURITY Failed to get session:', error);
      throw error;
    }
  }
  
  // If no session, try to refresh
  if (!cachedSession) {
    if (retryCount > 0) {
      console.log('SECURITY No session found, waiting for auth state...');
      await new Promise(resolve => setTimeout(resolve, 500));
      return withAuth(callback, retryCount - 1);
    }
    throw new Error('AuthSessionMissingError: Auth session missing!');
  }
  
  // Execute the callback with valid session
  try {
    return await callback();
  } catch (error: any) {
    // If it's an auth error, clear cache and retry once
    if (error?.message?.includes('Auth') && retryCount > 0) {
      console.log('SECURITY Auth error during execution, refreshing session...');
      cachedSession = null;
      lastSessionCheck = 0;
      return withAuth(callback, 1);
    }
    throw error;
  }
}

/**
 * Get current user with session validation
 */
export async function getCurrentUserWithAuth() {
  return withAuth(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    return user;
  });
}

/**
 * Clear cached session (call on logout)
 */
export function clearAuthCache() {
  cachedSession = null;
  lastSessionCheck = 0;
} 