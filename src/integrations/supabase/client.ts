/**
 * Centralized Supabase Client Re-export
 * 
 * This file re-exports the supabase client from @/lib/supabase
 * to ensure we have a single instance throughout the application.
 * 
 * This prevents the "Multiple GoTrueClient instances detected" warning
 * and ensures auth state is properly shared across all services.
 */

// Re-export everything from the centralized supabase client
export { 
  supabase, 
  authService, 
  checkSupabaseConnection,
  sessionService,
  handleAuthError 
} from '@/lib/supabase';
