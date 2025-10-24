/**
 * Common UI selectors for E2E tests
 */

export const commonSelectors = {
  // Navigation
  sidebar: '[data-testid="sidebar"], .sidebar, nav[role="navigation"]',
  mainContent: '[data-testid="main-content"], main, .main-content',
  
  // Buttons
  submitButton: '[data-testid="submit"], button[type="submit"], .submit-btn',
  cancelButton: '[data-testid="cancel"], .cancel-btn, [aria-label="Cancel"]',
  
  // Forms
  emailInput: '[data-testid="email-input"], input[type="email"], #email',
  passwordInput: '[data-testid="password-input"], input[type="password"], #password',
  
  // Messages
  errorMessage: '[data-testid="error"], .error-message, .alert-error',
  successMessage: '[data-testid="success"], .success-message, .alert-success',
  
  // Loading states
  loadingSpinner: '[data-testid="loading"], .loading, .spinner',
  
  // RTL specific
  rtlContainer: '[dir="rtl"], .rtl, [data-direction="rtl"]',
  ltrContainer: '[dir="ltr"], .ltr, [data-direction="ltr"]'
};

export const buttonSelectors = [
  '[data-testid*="button"]',
  'button',
  '[role="button"]',
  '.btn',
  'input[type="button"]',
  'input[type="submit"]'
];

export const navigationSelectors = [
  '[data-testid="navigation"]',
  '[data-testid="navbar"]', 
  'nav[role="navigation"]',
  '.navigation',
  '.navbar',
  'header nav'
];

export const contentSelectors = [
  '[data-testid="main-content"]',
  '[data-testid="content"]',
  'main[role="main"]',
  '.main-content',
  '#main-content',
  'section.content'
]; 