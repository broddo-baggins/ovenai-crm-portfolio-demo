// Combined analytics utility for Google Analytics and Microsoft Clarity
// This avoids type conflicts by handling both services in one place

import { initializeClarity } from "./clarity";

// Google Analytics tracking ID
const GA_TRACKING_ID = "G-CHK31P3GVT";

// Check if analytics is initialized
let analyticsInitialized = false;

// Safe window check
const isClient = () => typeof window !== "undefined";

// Initialize both analytics services
export const initializeAnalytics = () => {
  if (!isClient()) {
    console.log("Analytics initialization skipped - not in client environment");
    return;
  }

  try {
    if (!analyticsInitialized) {
      // Check if Google Analytics is loaded (gracefully handle blocked scripts)
      if (typeof (window as any).gtag === "function") {
        // Removed verbose analytics logging for cleaner UX
        // console.log("Google Analytics detected and ready");
      } else {
        // Don't warn immediately - GA might still be loading or blocked by ad blockers
        // Removed verbose analytics logging for cleaner UX
        // console.log(
        //   "Google Analytics not yet available (may be loading or blocked)",
        // );
      }

      // Initialize Microsoft Clarity properly
      initializeClarity();

      analyticsInitialized = true;
      // Removed verbose analytics logging for cleaner UX
      // console.log("Analytics services initialized");
    }
  } catch (error) {
    console.error("Analytics initialization failed:", error);
  }
};

// Enable analytics after consent is granted
export const enableAnalytics = (
  enableGA: boolean = true,
  enableClarity: boolean = true,
) => {
  if (!isClient()) return;

  try {
    // Enable Google Analytics
    if (enableGA && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });

      // Send initial page view after consent
      (window as any).gtag("config", GA_TRACKING_ID, {
        page_path: window.location.pathname,
        page_title: document.title,
        send_page_view: true,
      });

      console.log("Google Analytics enabled with consent");
    }

    // Microsoft Clarity doesn't need explicit consent enabling
    if (enableClarity) {
      console.log("Microsoft Clarity tracking enabled");
    }
  } catch (error) {
    console.error("Analytics enablement failed:", error);
  }
};

// Track page views in both services
export const trackPageView = (url: string, title?: string) => {
  if (!isClient()) return;

  try {
    // Only track if analytics is initialized
    if (!analyticsInitialized) {
      initializeAnalytics();
    }

    // Google Analytics - only if consent is granted and function exists
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: url,
      });
    }

    // Microsoft Clarity - send minimal data to prevent beacon overload
    if (typeof (window as any).clarity === "function") {
      // Only send essential data
      (window as any).clarity("event", "page_view", {
        path: url, // Minimal data to prevent 64KB limit
      });
    }
  } catch (error) {
    // Silent fail for analytics to prevent disrupting user experience
    console.debug("Page view tracking failed:", error);
  }
};

// Track custom events in both services
export const trackEvent = (
  eventName: string,
  category: string,
  label?: string,
  value?: number,
  additionalData?: Record<string, any>,
) => {
  if (!isClient()) return;

  try {
    // Google Analytics - only if function exists
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", eventName, {
        event_category: category,
        event_label: label,
        value: value,
        ...additionalData,
      });
    }

    // Microsoft Clarity - send only essential data to prevent beacon overload
    if (typeof (window as any).clarity === "function") {
      // Minimal payload to stay under 64KB limit
      const essentialData: any = { cat: category };
      if (label) essentialData.lbl = label;
      if (value !== undefined) essentialData.val = value;

      (window as any).clarity("event", eventName, essentialData);
    }
  } catch (error) {
    // Silent fail for analytics
    console.debug("Event tracking failed:", error);
  }
};

// Track conversions (Google Analytics)
export const trackConversion = (conversionId: string, value?: number) => {
  if (!isClient()) return;

  try {
    if ((window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: conversionId,
        value: value,
      });
    }
  } catch (error) {
    console.error("Conversion tracking failed:", error);
  }
};

// Track user engagement
export const trackEngagement = (
  engagementType: string,
  details?: Record<string, any>,
) => {
  if (!isClient()) return;

  try {
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag("event", "engagement", {
        engagement_type: engagementType,
        ...details,
      });
    }

    // Microsoft Clarity
    if ((window as any).clarity) {
      (window as any).clarity("event", "user_engagement", {
        type: engagementType,
        ...details,
      });
    }
  } catch (error) {
    console.error("Engagement tracking failed:", error);
  }
};

// Utility functions for common tracking scenarios
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent("click", "button", buttonName, undefined, { location });
};

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent("form_submit", "form", formName, success ? 1 : 0, { success });
};

export const trackUserAction = (
  action: string,
  details?: Record<string, any>,
) => {
  trackEvent("user_action", "interaction", action, undefined, details);
};
