import React from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { getLeadStateByValue } from '@/config/leadStates';
import { STATUS_STRING_TO_INT } from '@/utils/statusMapping';

interface LeadStatusBadgeProps {
  status: number | string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Specialized component for displaying lead status badges
 * Uses the centralized lead state definitions with compatibility for both numeric and string status values
 */
export function LeadStatusBadge({ 
  status, 
  showLabel = true,
  className 
}: LeadStatusBadgeProps) {
  // Convert string status to numeric for legacy compatibility
  const numericStatus = typeof status === 'string' ? (STATUS_STRING_TO_INT[status] || 0) : status;
  const state = getLeadStateByValue(numericStatus);
  
  return (
    <StatusBadge status={numericStatus} className={className}>
      {showLabel && state.label}
    </StatusBadge>
  );
}

/**
 * Component to display the next possible status options for a lead
 */
export function LeadStatusOptions({ 
  currentStatus, 
  onStatusChange 
}: {
  currentStatus: number | string;
  onStatusChange: (newStatus: number) => void;
}) {
  const numericStatus = typeof currentStatus === 'string' ? (STATUS_STRING_TO_INT[currentStatus] || 0) : currentStatus;
  const state = getLeadStateByValue(numericStatus);
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {state.nextSteps.map(nextStatus => {
        const nextState = getLeadStateByValue(nextStatus);
        return (
          <StatusBadge 
            key={nextStatus}
            status={nextStatus} 
            className="cursor-pointer hover:opacity-80"
            onClick={() => onStatusChange(nextStatus)}
          >
            {nextState.label}
          </StatusBadge>
        );
      })}
    </div>
  );
}

export default LeadStatusBadge;
