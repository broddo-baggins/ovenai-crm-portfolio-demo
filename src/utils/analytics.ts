// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    dataLayer: any[];
  }
}

// Google Analytics tracking ID
const GA_TRACKING_ID = 'G-CHK31P3GVT';

// Initialize Google Analytics (already done in HTML, but this ensures it's ready)
export const initializeGoogleAnalytics = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      page_title: title || document.title,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track conversions
export const trackConversion = (conversionId: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
    });
  }
};

// Track user engagement
export const trackEngagement = (engagementType: string, details?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'engagement', {
      engagement_type: engagementType,
      ...details,
    });
  }
}; 