
/**
 * Utility types for the Lead-Reviver project
 */

/**
 * Generic error type - more specific than 'any' but still flexible
 */
export type ErrorType = Error | { message: string } | string | unknown;

/**
 * Generic data type for API responses or event payloads
 */
export type DataPayload<T = Record<string, unknown>> = T;

/**
 * Type for event handlers that need to accept various data types
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Type for generic web API responses
 */
export type ApiResponse<T = Record<string, unknown>> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Generic object type with string keys
 */
export type GenericObject = Record<string, unknown>;

/**
 * HttpClient error shape (for axios, fetch, etc.)
 */
export type HttpClientError = {
  message: string;
  status?: number;
  data?: unknown;
};

/**
 * OAuth Profile structure (for Google, Facebook, etc.)
 */
export type OAuthProfile = {
  id: string;
  displayName?: string;
  name?: {
    givenName: string;
    familyName: string;
  };
  emails?: Array<{
    value: string;
  }>;
  [key: string]: unknown;
};
