/**
 * REFRESH STATUS MAPPING UTILITY
 * 
 * Maps between integer status values (old system) and string status values (new system)
 * to maintain compatibility after database migration from INTEGER to VARCHAR status
 */

// Integer to String mapping (for database migration compatibility)
export const STATUS_INT_TO_STRING: Record<number, string> = {
  1: 'new',
  2: 'pre-qualified',
  3: 'hook',
  4: 'value-proposition',
  5: 'questions-asked',
  6: 'engaged',
  7: 'qualified',
  8: 'clarifying',
  9: 'booked',
  10: 'follow-up',
  11: 'on-hold',
  12: 'dead',
};

// String to Integer mapping (for backward compatibility)
export const STATUS_STRING_TO_INT: Record<string, number> = {
  'new': 1,
  'pre-qualified': 2,
  'hook': 3,
  'value-proposition': 4,
  'questions-asked': 5,
  'engaged': 6,
  'qualified': 7,
  'clarifying': 8,
  'booked': 9,
  'follow-up': 10,
  'on-hold': 11,
  'dead': 12,
  // Handle migration default
  'unqualified': 1,
};

// Status categories for queue processing
export const STATUS_CATEGORIES = {
  PENDING: ['new', 'pre-qualified', 'unqualified'],
  QUEUED: ['hook', 'value-proposition'],
  ACTIVE: ['questions-asked'],
  COMPLETED: ['engaged', 'qualified', 'clarifying', 'booked'],
  FAILED: ['on-hold', 'dead'],
  PROCESSED: ['engaged', 'qualified', 'clarifying', 'booked', 'follow-up'],
} as const;

// Helper functions for status checking
export const isStatusInCategory = (status: string | number | null | undefined, category: keyof typeof STATUS_CATEGORIES): boolean => {
  if (!status) return false;
  
  // Convert integer to string if needed
  const statusStr = typeof status === 'number' ? STATUS_INT_TO_STRING[status] : status;
  if (!statusStr) return false;
  
  return (STATUS_CATEGORIES[category] as readonly string[]).includes(statusStr);
};

export const isPendingStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'PENDING');
};

export const isQueuedStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'QUEUED');
};

export const isActiveStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'ACTIVE');
};

export const isCompletedStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'COMPLETED');
};

export const isFailedStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'FAILED');
};

export const isProcessedStatus = (status: string | number | null | undefined): boolean => {
  return isStatusInCategory(status, 'PROCESSED');
};

// Get the next logical status in the pipeline
export const getNextStatus = (currentStatus: string | number): string => {
  const statusStr = typeof currentStatus === 'number' ? STATUS_INT_TO_STRING[currentStatus] : currentStatus;
  
  const progression = [
    'new',
    'pre-qualified',
    'hook',
    'value-proposition',
    'questions-asked',
    'engaged',
    'qualified',
    'clarifying',
    'booked'
  ];
  
  const currentIndex = progression.indexOf(statusStr || 'new');
  const nextIndex = Math.min(currentIndex + 1, progression.length - 1);
  
  return progression[nextIndex];
};

// Convert integer status to string (for migration compatibility)
export const intStatusToString = (status: number | null | undefined): string => {
  if (!status) return 'new';
  return STATUS_INT_TO_STRING[status] || 'new';
};

// Convert string status to integer (for backward compatibility)
export const stringStatusToInt = (status: string | null | undefined): number => {
  if (!status) return 1;
  return STATUS_STRING_TO_INT[status] || 1;
};

// Legacy compatibility - check if status matches old integer ranges
export const isLegacyPendingStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return [1, 2].includes(status);
  }
  return isPendingStatus(status);
};

export const isLegacyQueuedStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return [3, 4].includes(status);
  }
  return isQueuedStatus(status);
};

export const isLegacyActiveStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return [5].includes(status);
  }
  return isActiveStatus(status);
};

export const isLegacyCompletedStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return status >= 6 && status <= 10;
  }
  return isCompletedStatus(status);
};

export const isLegacyFailedStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return status >= 11;
  }
  return isFailedStatus(status);
};

export const isLegacyProcessedStatus = (status: any): boolean => {
  if (typeof status === 'number') {
    return status >= 6;
  }
  return isProcessedStatus(status);
};

// Get status for queue operations
export const getStatusForQueueOperation = (operation: 'pending' | 'queued' | 'active' | 'completed' | 'failed'): string => {
  const statusMap = {
    pending: 'new',
    queued: 'hook',
    active: 'questions-asked',
    completed: 'engaged',
    failed: 'dead'
  };
  
  return statusMap[operation];
}; 