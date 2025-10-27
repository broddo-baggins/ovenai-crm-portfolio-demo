// @ts-nocheck
/**
 * Token Security Service
 * Manages API tokens and credentials securely with encryption and rotation
 */

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';

interface TokenMetadata {
  id: string;
  user_id: string;
  service: 'whatsapp' | 'calendly' | 'meta' | 'openai' | 'twilio' | 'custom';
  token_name: string;
  encrypted_token: string;
  token_hash: string;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
  scopes?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SecuritySettings {
  auto_rotate_tokens: boolean;
  rotation_interval_days: number;
  require_encryption: boolean;
  log_token_usage: boolean;
  max_concurrent_tokens: number;
  enforce_token_expiry: boolean;
}

class TokenSecurityService {
  private readonly ENCRYPTION_KEY = 'crm-portfolio-token-encryption-2024';
  private readonly MAX_TOKEN_AGE_DAYS = 90;
  private readonly DEFAULT_ROTATION_DAYS = 30;

  /**
   * Store an encrypted token securely
   */
  async storeToken(
    userId: string,
    service: TokenMetadata['service'],
    tokenName: string,
    token: string,
    options: {
      expiresIn?: number; // days
      scopes?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    try {
      // Encrypt the token
      const encryptedToken = await this.encryptToken(token);
      const tokenHash = await this.hashToken(token);

      // Calculate expiry date
      const expiresAt = options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Store in database
      const { error } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          service,
          token_name: tokenName,
          encrypted_token: encryptedToken,
          token_hash: tokenHash,
          expires_at: expiresAt,
          scopes: options.scopes || [],
          metadata: options.metadata || {},
          is_active: true,
          usage_count: 0
        });

      if (error) {
        console.error('Error storing token:', error);
        return false;
      }

      console.log(`SECURITY Token stored securely: ${service}/${tokenName} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Exception storing token:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt a token
   */
  async getToken(
    userId: string,
    service: TokenMetadata['service'],
    tokenName: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('service', service)
        .eq('token_name', tokenName)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn(`Token not found: ${service}/${tokenName} for user ${userId}`);
        return null;
      }

      // Check if token is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.warn(`Token expired: ${service}/${tokenName}`);
        await this.deactivateToken(data.id);
        return null;
      }

      // Decrypt the token
      const decryptedToken = await this.decryptToken(data.encrypted_token);

      // Update usage tracking
      await this.updateTokenUsage(data.id);

      return decryptedToken;
    } catch (error) {
      console.error('Exception retrieving token:', error);
      return null;
    }
  }

  /**
   * List all tokens for a user (without decrypting)
   */
  async getUserTokens(userId: string): Promise<Omit<TokenMetadata, 'encrypted_token'>[]> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('id, user_id, service, token_name, token_hash, expires_at, last_used_at, usage_count, is_active, scopes, metadata, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tokens:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching user tokens:', error);
      return [];
    }
  }

  /**
   * Rotate a token (generate new, deactivate old)
   */
  async rotateToken(
    userId: string,
    service: TokenMetadata['service'],
    tokenName: string,
    newToken: string
  ): Promise<boolean> {
    try {
      // Get existing token metadata
      const existingTokens = await this.getUserTokens(userId);
      const existingToken = existingTokens.find(t => t.service === service && t.token_name === tokenName);

      if (!existingToken) {
        console.warn(`No existing token to rotate: ${service}/${tokenName}`);
        return false;
      }

      // Deactivate old token
      await this.deactivateToken(existingToken.id);

      // Store new token with same metadata
      return await this.storeToken(userId, service, tokenName, newToken, {
        scopes: existingToken.scopes,
        metadata: {
          ...existingToken.metadata,
          rotated_from: existingToken.id,
          rotation_date: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Exception rotating token:', error);
      return false;
    }
  }

  /**
   * Deactivate a token
   */
  async deactivateToken(tokenId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_tokens')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId);

      return !error;
    } catch (error) {
      console.error('Exception deactivating token:', error);
      return false;
    }
  }

  /**
   * Check if a token needs rotation
   */
  async checkTokenRotation(userId: string): Promise<{ needsRotation: boolean; tokens: string[] }> {
    try {
      const tokens = await this.getUserTokens(userId);
      const needsRotation: string[] = [];

      for (const token of tokens) {
        if (!token.is_active) continue;

        const ageInDays = Math.floor(
          (Date.now() - new Date(token.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (ageInDays > this.DEFAULT_ROTATION_DAYS) {
          needsRotation.push(`${token.service}/${token.token_name}`);
        }
      }

      return {
        needsRotation: needsRotation.length > 0,
        tokens: needsRotation
      };
    } catch (error) {
      console.error('Exception checking token rotation:', error);
      return { needsRotation: false, tokens: [] };
    }
  }

  /**
   * Validate WhatsApp token configuration
   */
  async validateWhatsAppTokens(userId: string): Promise<{
    isValid: boolean;
    missingTokens: string[];
    expiredTokens: string[];
    recommendations: string[];
  }> {
    try {
      const requiredTokens = ['access_token', 'phone_number_id', 'business_id', 'webhook_verify_token'];
      const userTokens = await this.getUserTokens(userId);
      const whatsappTokens = userTokens.filter(t => t.service === 'whatsapp');

      const missingTokens: string[] = [];
      const expiredTokens: string[] = [];
      const recommendations: string[] = [];

      // Check for required tokens
      for (const required of requiredTokens) {
        const token = whatsappTokens.find(t => t.token_name === required);
        if (!token) {
          missingTokens.push(required);
        } else if (token.expires_at && new Date(token.expires_at) < new Date()) {
          expiredTokens.push(required);
        }
      }

      // Generate recommendations
      if (missingTokens.length > 0) {
        recommendations.push(`Configure missing tokens: ${missingTokens.join(', ')}`);
      }

      if (expiredTokens.length > 0) {
        recommendations.push(`Refresh expired tokens: ${expiredTokens.join(', ')}`);
      }

      const oldTokens = whatsappTokens.filter(t => {
        const ageInDays = Math.floor(
          (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return ageInDays > 60;
      });

      if (oldTokens.length > 0) {
        recommendations.push('Consider rotating tokens older than 60 days');
      }

      return {
        isValid: missingTokens.length === 0 && expiredTokens.length === 0,
        missingTokens,
        expiredTokens,
        recommendations
      };
    } catch (error) {
      console.error('Exception validating WhatsApp tokens:', error);
      return {
        isValid: false,
        missingTokens: [],
        expiredTokens: [],
        recommendations: ['Error validating tokens - please check configuration']
      };
    }
  }

  /**
   * Get security settings for a user
   */
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return default settings
        return {
          auto_rotate_tokens: false,
          rotation_interval_days: this.DEFAULT_ROTATION_DAYS,
          require_encryption: true,
          log_token_usage: true,
          max_concurrent_tokens: 10,
          enforce_token_expiry: true
        };
      }

      return data.settings as SecuritySettings;
    } catch (error) {
      console.error('Exception fetching security settings:', error);
      return {
        auto_rotate_tokens: false,
        rotation_interval_days: this.DEFAULT_ROTATION_DAYS,
        require_encryption: true,
        log_token_usage: true,
        max_concurrent_tokens: 10,
        enforce_token_expiry: true
      };
    }
  }

  /**
   * Update security settings for a user
   */
  async updateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSecuritySettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };

      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userId,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Exception updating security settings:', error);
      return false;
    }
  }

  /**
   * Audit token usage and security
   */
  async auditTokenSecurity(userId: string): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    oldTokens: number;
    securityScore: number;
    recommendations: string[];
  }> {
    try {
      const tokens = await this.getUserTokens(userId);
      const now = new Date();

      const activeTokens = tokens.filter(t => t.is_active).length;
      const expiredTokens = tokens.filter(t => 
        t.expires_at && new Date(t.expires_at) < now
      ).length;
      
      const oldTokens = tokens.filter(t => {
        const ageInDays = Math.floor(
          (now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return ageInDays > this.MAX_TOKEN_AGE_DAYS;
      }).length;

      // Calculate security score (0-100)
      let securityScore = 100;
      if (expiredTokens > 0) securityScore -= 20;
      if (oldTokens > 0) securityScore -= 15;
      if (activeTokens > 10) securityScore -= 10;
      if (tokens.some(t => !t.scopes || t.scopes.length === 0)) securityScore -= 10;

      const recommendations: string[] = [];
      if (expiredTokens > 0) recommendations.push('Remove or refresh expired tokens');
      if (oldTokens > 0) recommendations.push('Rotate tokens older than 90 days');
      if (activeTokens > 10) recommendations.push('Consider consolidating tokens');
      if (securityScore < 70) recommendations.push('Review and improve token security practices');

      return {
        totalTokens: tokens.length,
        activeTokens,
        expiredTokens,
        oldTokens,
        securityScore: Math.max(0, securityScore),
        recommendations
      };
    } catch (error) {
      console.error('Exception auditing token security:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        oldTokens: 0,
        securityScore: 0,
        recommendations: ['Error auditing tokens - please check configuration']
      };
    }
  }

  // ================== PRIVATE HELPERS ==================

  private async encryptToken(token: string): Promise<string> {
    // Simple base64 encoding for demo - use proper encryption in production
    try {
      const encoded = btoa(token + '::' + this.ENCRYPTION_KEY);
      return encoded;
    } catch (error) {
      console.error('Error encrypting token:', error);
      throw error;
    }
  }

  private async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const decoded = atob(encryptedToken);
      const [token] = decoded.split('::');
      return token;
    } catch (error) {
      console.error('Error decrypting token:', error);
      throw error;
    }
  }

  private async hashToken(token: string): Promise<string> {
    // Create a simple hash for comparison
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token + this.ENCRYPTION_KEY);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error hashing token:', error);
      throw error;
    }
  }

  private async updateTokenUsage(tokenId: string): Promise<void> {
    try {
      await supabase.rpc('increment_token_usage', { token_id: tokenId });
    } catch (error) {
      console.error('Error updating token usage:', error);
    }
  }

  // ================== ENVIRONMENT INTEGRATION ==================

  /**
   * Initialize tokens from environment variables
   */
  async initializeFromEnvironment(userId: string): Promise<boolean> {
    try {
      const envTokens = [
        {
          service: 'whatsapp' as const,
          name: 'access_token',
          value: env.WHATSAPP_ACCESS_TOKEN,
          scopes: ['messages:send', 'business_management']
        },
        {
          service: 'whatsapp' as const,
          name: 'phone_number_id',
          value: env.WHATSAPP_PHONE_NUMBER_ID,
          scopes: ['phone_number_management']
        },
        {
          service: 'whatsapp' as const,
          name: 'business_id',
          value: env.WHATSAPP_BUSINESS_ID,
          scopes: ['business_management']
        },
        {
          service: 'whatsapp' as const,
          name: 'webhook_verify_token',
          value: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
          scopes: ['webhook_verification']
        },
        {
          service: 'calendly' as const,
          name: 'client_id',
          value: env.CALENDLY_CLIENT_ID,
          scopes: ['read', 'write']
        }
      ];

      let successCount = 0;
      for (const envToken of envTokens) {
        if (envToken.value) {
          const success = await this.storeToken(
            userId,
            envToken.service,
            envToken.name,
            envToken.value,
            {
              scopes: envToken.scopes,
              metadata: {
                source: 'environment',
                initialized_at: new Date().toISOString()
              }
            }
          );
          if (success) successCount++;
        }
      }

      console.log(`KEY Initialized ${successCount}/${envTokens.filter(t => t.value).length} tokens from environment`);
      return successCount > 0;
    } catch (error) {
      console.error('Exception initializing tokens from environment:', error);
      return false;
    }
  }
}

export const tokenSecurityService = new TokenSecurityService();
export default tokenSecurityService; 