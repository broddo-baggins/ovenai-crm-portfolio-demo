/**
 * Global site settings
 * These settings can be updated without requiring code changes
 */
export const siteSettings = {
  // Company information
  company: {
    name: "CRM Demo - Portfolio Project",
    domain: "amityogev.com",
    email: {
      contact: "amit.yogev@gmail.com",
      support: "amit.yogev@gmail.com",
      privacy: "amit.yogev@gmail.com",
    },
  },
  
  // Social media links
  social: {
    twitter: "https://twitter.com/crmdemo",
    linkedin: "https://linkedin.com/company/crmdemo",
    github: "https://github.com/crmdemo",
  },
  
  // Legal document dates
  termsUpdated: "2025-04-01",
  privacyUpdated: "2025-05-10", // This can be updated when policy changes without code change
  
  // Application settings
  app: {
    name: 'CRM Demo',
    version: '2.1.0',
    environment: process.env.NODE_ENV || 'development'
  },

  // Feature flags for controlled rollout
  features: {
    enableAnalytics: true,
    enableMarketing: true,
    enhancedGridControls: true, // Enable hover-based grid visibility
    autoSave: true, // Enable auto-save functionality
    exportImport: true, // Enable layout export/import
    performanceOptimizations: true // Enable CSS transforms and other optimizations
  },

  // Dashboard configuration
  dashboard: {
    defaultGridConfig: {
      cols: { lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 },
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      rowHeight: 60,
      margin: [8, 8],
      containerPadding: [16, 16]
    },
    autoSaveDelay: 1000, // milliseconds
    maxWidgets: 50,
    enableGridGuides: true,
    enableSnapToGrid: true
  },

  // UI preferences
  ui: {
    theme: 'light',
    animations: true,
    tooltips: true,
    compactMode: false
  }
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof siteSettings.features): boolean => {
  return siteSettings.features[feature] === true;
};

// Helper function to get dashboard config
export const getDashboardConfig = () => {
  return siteSettings.dashboard;
};

export default siteSettings;
