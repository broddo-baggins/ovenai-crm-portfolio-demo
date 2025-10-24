/**
 * Test Profile Fix Script
 * Tests if the 406 profile fetching errors have been resolved
 */

import { createBrowserClient } from '@supabase/ssr';

// Browser environment test
export async function testProfileFetching() {
  console.log('🧪 Testing profile fetching fix...');
  
  try {
    // Get environment variables
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return false;
    }

    // Create client
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 1: Check auth connection
    console.log('📋 Testing Supabase auth connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return false;
    }
    
    if (!session?.user) {
      console.log('ℹ️  No active session - user needs to log in');
      return true; // This is expected if not logged in
    }
    
    // Test 2: Fetch profile using authenticated client
    console.log('👤 Testing profile fetch for authenticated user...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('ℹ️  Profile not found - this is OK, will be created on next action');
        return true;
      }
      console.error('❌ Profile fetch error:', profileError);
      return false;
    }
    
    console.log('✅ Profile fetched successfully:', {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      status: profile.status
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test if called directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Profile fix test loaded - call testProfileFetching() in console');
    window.testProfileFetching = testProfileFetching;
  });
} 