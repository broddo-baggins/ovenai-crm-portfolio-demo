/**
 * Global Auth Sync Service
 * Ensures consistent auth state across all services
 * DEMO MODE: Bypasses authentication and returns mock user
 */

import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Demo mode mock user
const DEMO_USER: User = {
  id: 'demo-user-12345',
  email: 'demo@ovenai.example.com',
  role: 'authenticated',
  app_metadata: { provider: 'demo' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  user_metadata: {
    name: 'Demo User',
    full_name: 'Demo User',
    avatar_url: undefined,
    role: 'ADMIN',
    is_admin: true
  }
} as User;

const DEMO_SESSION: Session = {
  user: DEMO_USER,
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer'
};

class AuthSyncService {
  private static instance: AuthSyncService;
  private currentSession: Session | null = null;
  private currentUser: User | null = null;
  private initialized = false;
  private isDemoMode: boolean;
  
  static getInstance() {
    if (!AuthSyncService.instance) {
      AuthSyncService.instance = new AuthSyncService();
    }
    return AuthSyncService.instance;
  }
  
  private constructor() {
    // Check if demo mode is enabled
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (this.isDemoMode) {
      console.log('DEMO [DEMO MODE] Auth sync initialized with mock user');
      this.currentSession = DEMO_SESSION;
      this.currentUser = DEMO_USER;
      this.initialized = true;
    } else {
      this.initialize();
    }
  }
  
  private async initialize() {
    if (this.initialized) return;
    
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      this.currentSession = session;
      this.currentUser = session?.user || null;
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        
        this.currentSession = session;
        this.currentUser = session?.user || null;
        
        // Broadcast auth change to all listeners
        window.dispatchEvent(new CustomEvent('auth-state-sync', {
          detail: { event, session, user: session?.user }
        }));
      });
      
      this.initialized = true;
      
    } catch (error) {
      console.error('ERROR Auth sync initialization failed:', error);
    }
  }
  
  getSession(): Session | null {
    // DEMO MODE: Always return demo session
    if (this.isDemoMode) {
      return DEMO_SESSION;
    }
    return this.currentSession;
  }
  
  getUser(): User | null {
    // DEMO MODE: Always return demo user
    if (this.isDemoMode) {
      return DEMO_USER;
    }
    return this.currentUser;
  }
  
  async ensureSession(): Promise<Session> {
    // DEMO MODE: Always return demo session
    if (this.isDemoMode) {
      console.log('DEMO [DEMO MODE] ensureSession() returning mock session');
      return DEMO_SESSION;
    }
    
    if (this.currentSession) {
      return this.currentSession;
    }
    
    // Try to get session from supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('AuthSessionMissingError: Auth session missing!');
    }
    
    this.currentSession = session;
    this.currentUser = session.user;
    return session;
  }
  
  async ensureUser(): Promise<User> {
    // DEMO MODE: Always return demo user
    if (this.isDemoMode) {
      console.log('DEMO [DEMO MODE] ensureUser() returning mock user');
      return DEMO_USER;
    }
    
    const session = await this.ensureSession();
    if (!session.user) {
      throw new Error('User not authenticated');
    }
    return session.user;
  }
  
  clearSession() {
    // DEMO MODE: Don't clear demo session
    if (this.isDemoMode) {
      console.log('DEMO [DEMO MODE] clearSession() ignored in demo mode');
      return;
    }
    
    this.currentSession = null;
    this.currentUser = null;
  }
}

// Export singleton instance
export const authSync = AuthSyncService.getInstance(); 