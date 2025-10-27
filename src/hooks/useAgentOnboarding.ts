/**
 * useAgentOnboarding Hook
 * 
 * Manages the agent discovery/onboarding experience for first-time users.
 * Shows progressive hints to help users discover the AI assistant feature.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_INTERACTED = 'agent_interacted';
const STORAGE_KEY_VISIT_COUNT = 'agent_visit_count';
const STORAGE_KEY_TOOLTIP_DISMISSED = 'agent_tooltip_dismissed';

const MAX_TOOLTIP_VISITS = 3;  // Show tooltip for first 3 visits
const MAX_PULSE_VISITS = 8;     // Show pulsing for visits 4-8

interface UseAgentOnboardingReturn {
  showTooltip: boolean;
  showPulse: boolean;
  hasInteracted: boolean;
  visitCount: number;
  dismissTooltip: () => void;
  markAsInteracted: () => void;
  resetOnboarding: () => void;
}

export function useAgentOnboarding(): UseAgentOnboardingReturn {
  // Check if user has interacted with the agent
  const [hasInteracted, setHasInteracted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_INTERACTED) === 'true';
  });

  // Track visit count
  const [visitCount, setVisitCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEY_VISIT_COUNT) || '0');
  });

  // Check if tooltip was manually dismissed
  const [tooltipDismissed, setTooltipDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_TOOLTIP_DISMISSED) === 'true';
  });

  // Increment visit count on mount (only if not interacted)
  useEffect(() => {
    if (!hasInteracted) {
      const newCount = visitCount + 1;
      setVisitCount(newCount);
      localStorage.setItem(STORAGE_KEY_VISIT_COUNT, newCount.toString());
    }
  }, []); // Run only once on mount

  // Determine what to show
  const showTooltip = !hasInteracted && !tooltipDismissed && visitCount <= MAX_TOOLTIP_VISITS;
  const showPulse = !hasInteracted && visitCount > MAX_TOOLTIP_VISITS && visitCount <= MAX_PULSE_VISITS;

  // Dismiss the tooltip (but keep showing pulse)
  const dismissTooltip = useCallback(() => {
    setTooltipDismissed(true);
    localStorage.setItem(STORAGE_KEY_TOOLTIP_DISMISSED, 'true');
  }, []);

  // Mark as interacted (user clicked on agent)
  const markAsInteracted = useCallback(() => {
    setHasInteracted(true);
    localStorage.setItem(STORAGE_KEY_INTERACTED, 'true');
    
    // Also dismiss tooltip
    setTooltipDismissed(true);
    localStorage.setItem(STORAGE_KEY_TOOLTIP_DISMISSED, 'true');
  }, []);

  // Reset onboarding (for testing/debugging)
  const resetOnboarding = useCallback(() => {
    setHasInteracted(false);
    setVisitCount(0);
    setTooltipDismissed(false);
    localStorage.removeItem(STORAGE_KEY_INTERACTED);
    localStorage.removeItem(STORAGE_KEY_VISIT_COUNT);
    localStorage.removeItem(STORAGE_KEY_TOOLTIP_DISMISSED);
  }, []);

  return {
    showTooltip,
    showPulse,
    hasInteracted,
    visitCount,
    dismissTooltip,
    markAsInteracted,
    resetOnboarding,
  };
}

export default useAgentOnboarding;

