/**
 * Debug utilities for development
 */

export const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn('[DEBUG]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error('[DEBUG]', ...args);
    }
  }
};

export default debug; 