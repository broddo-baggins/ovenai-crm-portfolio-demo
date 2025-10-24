/**
 * RTL (Right-to-Left) debugging utilities
 */

export const debugRTLOnLogin = () => {
  if (import.meta.env.DEV) {
    console.log('[RTL DEBUG] Login form rendered');
  }
};

export const debugRTL = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[RTL DEBUG] ${message}`, data);
    }
  },
  
  detectDirection: (element?: HTMLElement) => {
    if (import.meta.env.DEV && element) {
      const direction = window.getComputedStyle(element).direction;
      console.log('[RTL DEBUG] Element direction:', direction);
      return direction;
    }
    return 'ltr';
  }
}; 