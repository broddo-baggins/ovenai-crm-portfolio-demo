/**
 * Utilities and helper functions
 * 
 * Note: Some utilities are marked as deprecated and should be replaced
 * with more robust alternatives from the services/base directory
 */

// Legacy debug utility - use Logger service instead
export { debug } from './debug';

// One-time migration utility - remove after use
export { cleanupSuccessRateWidget } from './clearSuccessRateWidget';

// Re-export commonly used utilities
export { cn } from '@/lib/utils'; 