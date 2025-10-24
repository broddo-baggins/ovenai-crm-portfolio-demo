
/**
 * Centralized messages for the application
 * Used to maintain consistent messaging and make updates easier
 */

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Invalid credentials or connection error',
  ACCOUNT_PENDING: 'Your account is pending approval',
  API_UNAVAILABLE: 'Authentication service is currently unavailable. Please try again later.',
  API_UNAVAILABLE_DEV: 'Backend server is unavailable. Contact your administrator for assistance.',
  REGISTER_SUCCESS: 'Registration submitted successfully. An administrator will review your request.',
  REGISTER_FAILED: 'Registration failed',
  DEV_MODE_SUCCESS: 'Connected in development mode (backend unavailable)',
  DEV_MODE_FAILED: 'Development login failed. Please contact your administrator.',
  LOGOUT_SUCCESS: 'Successfully logged out',
};

export const FORM_LABELS = {
  EMAIL_PLACEHOLDER: 'name@example.com',
  PASSWORD_PLACEHOLDER: '••••••••',
  NAME_PLACEHOLDER: 'John Doe',
};

export const FEATURE_MESSAGES = {
  COMING_SOON: 'This feature is coming soon',
};
