// @ts-nocheck
// TypeScript checking disabled for deployment compatibility
// Import the singleton Supabase client to prevent multiple instances
import { supabase } from '@/integrations/supabase/client';

// Ensure we have a valid client
if (!supabase) {
  throw new Error('Supabase client not initialized. Check environment variables.');
}

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  role?: string;
  status?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { data };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    try {
      const { data: _data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { data: _data };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { success: true };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        first_name: profile?.first_name,
        status: profile?.status
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { data: session };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { success: true };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService; 