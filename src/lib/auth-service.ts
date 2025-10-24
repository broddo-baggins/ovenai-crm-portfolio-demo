import { supabase } from './supabase';
import { ServiceErrorHandler } from '@/services/base/errorHandler';

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: {
    user?: {
      id: string;
      email?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export const authService = {
  // 1. Confirm Signup
  async confirmSignup(token: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) throw error;
        return { success: true };
      },
      'AuthService',
      'confirmSignup'
    ).then(result => result.data || { success: false, error: result.error });
  },

  // 2. Invite User
  async inviteUser(email: string, redirectTo?: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        });

        if (error) throw error;
        return { success: true };
      },
      'AuthService',
      'inviteUser'
    ).then(result => result.data || { success: false, error: result.error });
  },

  // 3. Magic Link
  async sendMagicLink(email: string, redirectTo?: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;
        return { success: true };
      },
      'AuthService',
      'sendMagicLink'
    ).then(result => result.data || { success: false, error: result.error });
  },

  // 4. Change Email Address
  async changeEmail(newEmail: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await supabase.auth.updateUser({
          email: newEmail
        });

        if (error) throw error;
        return { success: true };
      },
      'AuthService',
      'changeEmail'
    ).then(result => result.data || { success: false, error: result.error });
  },

  // 5. Reset Password
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });

        if (error) throw error;

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) throw updateError;
        return { success: true };
      },
      'AuthService',
      'resetPassword'
    ).then(result => result.data || { success: false, error: result.error });
  },

  // 6. Reauthentication
  async reauthenticate(password: string): Promise<AuthResponse> {
    return ServiceErrorHandler.handleAsyncError(
      async () => {
        // Note: Supabase doesn't have a direct reauthenticate method with password
        // This might need to be implemented differently based on your auth flow
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user?.email) {
          throw new Error('No authenticated user found');
        }

        // Attempt to sign in again with the provided password
        const { error } = await supabase.auth.signInWithPassword({
          email: user.user.email,
          password
        });

        if (error) throw error;
        return { success: true };
      },
      'AuthService',
      'reauthenticate'
    ).then(result => result.data || { success: false, error: result.error });
  }
}; 