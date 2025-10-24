import { userCredentialsService } from './userCredentialsService';
import { env } from '@/config/env';
import { toast } from 'sonner';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  location?: string;
  status: string;
  htmlLink: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
}

export interface GoogleCalendarUser {
  email: string;
  name: string;
  picture?: string;
  timeZone: string;
}

class GoogleCalendarService {
  private readonly CLIENT_ID = env.GOOGLE_CLIENT_ID;
  private readonly CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
  private readonly REDIRECT_URI = env.GOOGLE_REDIRECT_URI;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');

  /**
   * Generate Google OAuth authorization URL
   */
  async getAuthorizationUrl(): Promise<string> {
    const state = this.generateRandomString(32);
    sessionStorage.setItem('google_oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: this.SCOPES,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    const storedState = sessionStorage.getItem('google_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();
    
    // Store tokens securely
    await userCredentialsService.saveServiceCredentials('google_calendar', {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      token_type: tokenData.token_type || 'Bearer'
    });

    return tokenData;
  }

  /**
   * Get current user's Google profile
   */
  async getCurrentUser(): Promise<GoogleCalendarUser> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    const userData = await response.json();
    
    return {
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Get calendar events for a date range
   */
  async getEvents(options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
  } = {}): Promise<GoogleCalendarEvent[]> {
    const accessToken = await this.getValidAccessToken();
    
    const params = new URLSearchParams({
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: (options.maxResults || 100).toString(),
      singleEvents: (options.singleEvents !== false).toString(),
      orderBy: options.orderBy || 'startTime'
    });

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Check if Google Calendar is connected
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    user?: GoogleCalendarUser;
    error?: string;
  }> {
    try {
      const credentials = await userCredentialsService.getServiceCredentials('google_calendar');
      
      if (!credentials?.length || !credentials[0]?.encrypted_value) {
        return { connected: false, error: 'No access token found' };
      }

      // Try to get user profile to verify connection
      const user = await this.getCurrentUser();
      
      return {
        connected: true,
        user: user
      };
    } catch (error) {
      console.error('Google Calendar connection check failed:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<void> {
    try {
      const credentials = await userCredentialsService.getServiceCredentials('google_calendar');
      
      if (credentials?.length && credentials[0]?.encrypted_value) {
        // Parse the encrypted credentials to get access token
        const credData = JSON.parse(atob(credentials[0].encrypted_value));
        if (credData.access_token) {
          // Revoke the token
          await fetch(`https://oauth2.googleapis.com/revoke?token=${credData.access_token}`, {
            method: 'POST',
          });
        }
      }
    } catch (error) {
      console.warn('Failed to revoke Google token:', error);
    }
    
    // Remove stored credentials
    await userCredentialsService.deleteServiceCredentials('google_calendar');
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(): Promise<string> {
    const credentials = await userCredentialsService.getServiceCredentials('google_calendar');
    
    if (!credentials?.length || !credentials[0]?.encrypted_value) {
      throw new Error('No Google Calendar access token found');
    }

    // Parse the encrypted credentials
    const credData = JSON.parse(atob(credentials[0].encrypted_value));
    
    if (!credData.access_token) {
      throw new Error('No access token in stored credentials');
    }

    // Check if token is expired
    if (credData.expires_at && Date.now() >= credData.expires_at) {
      if (credData.refresh_token) {
        return await this.refreshAccessToken(credData.refresh_token);
      } else {
        throw new Error('Access token expired and no refresh token available');
      }
    }

    return credData.access_token;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();
    
    // Update stored credentials
    await userCredentialsService.saveServiceCredentials('google_calendar', {
      access_token: tokenData.access_token,
      refresh_token: refreshToken, // Keep existing refresh token
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      token_type: tokenData.token_type || 'Bearer'
    });

    return tokenData.access_token;
  }

  /**
   * Generate random string for OAuth state
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const googleCalendarService = new GoogleCalendarService(); 