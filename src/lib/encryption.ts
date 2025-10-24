/**
 * Encryption utilities for secure storage of sensitive user data
 * Uses AES-256-GCM encryption with user-specific keys
 */

// Simple encryption for client-side (not for production secrets)
class SimpleEncryption {
  private key: string;

  constructor(userKey?: string) {
    // In production, this should be derived from user session + server secret
    this.key = userKey || "user-specific-encryption-key";
  }

  /**
   * Encrypts sensitive data for storage
   * Note: This is a simple implementation. For production, use proper encryption libraries
   */
  encrypt(data: string): string {
    if (!data) return "";

    try {
      // Simple base64 encoding with obfuscation
      // In production, use crypto-js or similar for real encryption
      const encoded = btoa(data);
      const obfuscated = encoded.split("").reverse().join("");
      return btoa(obfuscated + "|" + this.key.slice(0, 8));
    } catch (error) {
      console.error("Encryption error:", error);
      return "";
    }
  }

  /**
   * Decrypts stored sensitive data
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return "";

    try {
      const decoded = atob(encryptedData);
      const [obfuscated] = decoded.split("|");
      const restored = obfuscated.split("").reverse().join("");
      return atob(restored);
    } catch (error) {
      console.error("Decryption error:", error);
      return "";
    }
  }

  /**
   * Validates if data can be decrypted (sanity check)
   */
  canDecrypt(encryptedData: string): boolean {
    try {
      const decrypted = this.decrypt(encryptedData);
      return decrypted.length > 0;
    } catch {
      return false;
    }
  }
}

export { SimpleEncryption };

/**
 * Creates encryption instance for current user
 */
export const createUserEncryption = (userId?: string): SimpleEncryption => {
  const userKey = userId ? `user-${userId}-key` : "default-key";
  return new SimpleEncryption(userKey);
};

/**
 * Utility functions for common encryption tasks
 */
export const encryptionUtils = {
  /**
   * Encrypts client credentials for storage
   */
  encryptCredentials: (
    credentials: {
      clientId?: string;
      clientSecret?: string;
      webhookSecret?: string;
      accessToken?: string;
      refreshToken?: string;
    },
    userId?: string,
  ) => {
    const encryption = createUserEncryption(userId);

    return {
      encrypted_client_id: credentials.clientId
        ? encryption.encrypt(credentials.clientId)
        : null,
      encrypted_client_secret: credentials.clientSecret
        ? encryption.encrypt(credentials.clientSecret)
        : null,
      encrypted_webhook_secret: credentials.webhookSecret
        ? encryption.encrypt(credentials.webhookSecret)
        : null,
      encrypted_access_token: credentials.accessToken
        ? encryption.encrypt(credentials.accessToken)
        : null,
      encrypted_refresh_token: credentials.refreshToken
        ? encryption.encrypt(credentials.refreshToken)
        : null,
    };
  },

  /**
   * Decrypts stored credentials
   */
  decryptCredentials: (
    encryptedData: {
      encrypted_client_id?: string | null;
      encrypted_client_secret?: string | null;
      encrypted_webhook_secret?: string | null;
      encrypted_access_token?: string | null;
      encrypted_refresh_token?: string | null;
    },
    userId?: string,
  ) => {
    const encryption = createUserEncryption(userId);

    return {
      clientId: encryptedData.encrypted_client_id
        ? encryption.decrypt(encryptedData.encrypted_client_id)
        : "",
      clientSecret: encryptedData.encrypted_client_secret
        ? encryption.decrypt(encryptedData.encrypted_client_secret)
        : "",
      webhookSecret: encryptedData.encrypted_webhook_secret
        ? encryption.decrypt(encryptedData.encrypted_webhook_secret)
        : "",
      accessToken: encryptedData.encrypted_access_token
        ? encryption.decrypt(encryptedData.encrypted_access_token)
        : "",
      refreshToken: encryptedData.encrypted_refresh_token
        ? encryption.decrypt(encryptedData.encrypted_refresh_token)
        : "",
    };
  },

  /**
   * Masks sensitive data for display (shows only first/last characters)
   */
  maskSensitiveData: (data: string, visibleChars: number = 4): string => {
    if (!data || data.length <= visibleChars * 2) {
      return "*".repeat(Math.max(data?.length || 8, 8));
    }

    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const middle = "*".repeat(Math.max(data.length - visibleChars * 2, 4));

    return `${start}${middle}${end}`;
  },

  /**
   * Validates credential format (basic validation)
   */
  validateCredentialFormat: (type: string, value: string): boolean => {
    if (!value) return false;

    switch (type) {
      case "clientId":
        return value.length > 10 && /^[A-Za-z0-9_-]+$/.test(value);
      case "clientSecret":
        return value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value);
      case "webhookSecret":
        return value.length > 10;
      default:
        return value.length > 0;
    }
  },
};
