import Clarity from "@microsoft/clarity";

// Microsoft Clarity configuration
const CLARITY_PROJECT_ID =
  import.meta.env.VITE_CLARITY_PROJECT_ID || "YOUR_CLARITY_PROJECT_ID";

// Track initialization state
let clarityInitialized = false;

// Extend Window interface to include clarity
declare global {
  interface Window {
    clarity: any;
  }
}

// Initialize Microsoft Clarity with proper npm package
export const initializeClarity = () => {
  if (typeof window === "undefined") {
    console.log("Clarity initialization skipped - not in browser environment");
    return;
  }

  if (clarityInitialized) {
    console.log("Clarity already initialized");
    return;
  }

  try {
    // Initialize Clarity with project ID
    if (
      CLARITY_PROJECT_ID &&
      CLARITY_PROJECT_ID !== "YOUR_CLARITY_PROJECT_ID"
    ) {
      Clarity.init(CLARITY_PROJECT_ID);
      clarityInitialized = true;
      console.log(
        "SUCCESS Microsoft Clarity initialized successfully with project ID:",
        CLARITY_PROJECT_ID,
      );
    } else {
      // Silently skip initialization if no project ID is configured
      // Removed verbose clarity logging for cleaner UX
      // console.debug(
      //   "Microsoft Clarity project ID not configured - analytics disabled",
      // );
    }
  } catch (error) {
    console.error("ERROR Microsoft Clarity initialization failed:", error);
  }
};

// Helper function to track custom events
export const trackClarityEvent = (
  eventName: string,
  data?: Record<string, any>,
) => {
  if (typeof window === "undefined") return;

  try {
    if (clarityInitialized && window.clarity) {
      // Ensure data stays under Clarity's limits
      const cleanData = data ? JSON.parse(JSON.stringify(data)) : {};
      window.clarity("event", eventName, cleanData);
    } else {
      console.debug("Clarity not initialized, skipping event:", eventName);
    }
  } catch (error) {
    console.error("Clarity event tracking failed:", error);
  }
};

// Helper function to track page views
export const trackClarityPageView = (
  pageName: string,
  additionalData?: Record<string, any>,
) => {
  trackClarityEvent("page_view", {
    page: pageName,
    ...additionalData,
  });
};

// Helper function to track user interactions
export const trackClarityInteraction = (
  interactionType: string,
  element: string,
  additionalData?: Record<string, any>,
) => {
  trackClarityEvent("user_interaction", {
    type: interactionType,
    element,
    ...additionalData,
  });
};

// Set custom user tags (useful for debugging)
export const setClarityCustomTag = (key: string, value: string) => {
  if (typeof window === "undefined") return;

  try {
    if (clarityInitialized && window.clarity) {
      window.clarity("set", key, value);
      console.log(`🏷️ Clarity custom tag set: ${key} = ${value}`);
    }
  } catch (error) {
    console.error("Clarity custom tag failed:", error);
  }
};

// Identify users (for user session tracking)
export const identifyClarityUser = (
  userId: string,
  sessionData?: Record<string, any>,
) => {
  if (typeof window === "undefined") return;

  try {
    if (clarityInitialized && window.clarity) {
      window.clarity("identify", userId, sessionData);
      console.log(`👤 Clarity user identified: ${userId}`, sessionData);
    }
  } catch (error) {
    console.error("Clarity user identification failed:", error);
  }
};

// Get Clarity session information
export const getClaritySessionInfo = (): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    try {
      if (clarityInitialized && window.clarity) {
        window.clarity("consent");
        // Clarity doesn't provide direct session info API, so we return basic info
        resolve({
          initialized: true,
          projectId: CLARITY_PROJECT_ID,
          timestamp: new Date().toISOString(),
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error("Clarity session info failed:", error);
      resolve(null);
    }
  });
};

// Check if Clarity is properly initialized
export const isClarityInitialized = (): boolean => {
  return (
    clarityInitialized && typeof window !== "undefined" && !!window.clarity
  );
};

// Export configuration for debugging
export const getClarityConfig = () => ({
  projectId: CLARITY_PROJECT_ID,
  initialized: clarityInitialized,
  available: typeof window !== "undefined" && !!window.clarity,
});
