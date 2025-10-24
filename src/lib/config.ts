import logger from "@/services/base/logger";

/**
 * Shared configuration constants for the application
 * These are derived from environment variables and provide a centralized
 * way to access configuration throughout the application
 */

// API URL - falls back to relative path if not specified
// In production, use Supabase functions instead of missing /api endpoints
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? import.meta.env.VITE_SUPABASE_URL + "/functions/v1"
    : "/api");

// Base application URL - lazy evaluation to prevent "uninitialized variable" error
export const getAppURL = (): string => {
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  // Safe window access
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }

  // Fallback for SSR or environments where window is not available
  return "http://localhost:3000";
};

// Legacy export - DEPRECATED: Use getAppURL() for all new code
// This is kept for backward compatibility only
export const APP_URL = "";

// Environment detection - used for feature toggles
export const IS_DEV = import.meta.env.VITE_ENVIRONMENT === "development";

// Feature flags
export const FALLBACK_LOGIN_ENABLED =
  import.meta.env.VITE_ENABLE_FALLBACK_LOGIN === "true" && IS_DEV;
export const REGISTRATION_ENABLED =
  import.meta.env.VITE_ALLOW_REGISTRATION === "true";

// Staging mode detection
// Staging environment removed - use regular authentication in tests

// Log configuration in development only
if (IS_DEV) {
  logger.info("Application configuration loaded", "Config", {
    API_URL,
    APP_URL: getAppURL(),
    environment: IS_DEV ? "development" : "production",
    features: {
      fallbackLogin: FALLBACK_LOGIN_ENABLED,
      registration: REGISTRATION_ENABLED,
    },
  });
}
