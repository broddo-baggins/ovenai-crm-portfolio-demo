
/**
 * Lead States Configuration
 * 
 * This file defines the central configuration for lead states throughout the application.
 * These states are used consistently across:
 * - Supabase tables (leads.status)
 * - Redis state tracking (sess:{phone}.state)
 * - Frontend display components
 * - n8n routing and timers
 */

export enum LeadStatusValue {
  NEW = 0,              // New lead, not yet contacted
  PRE_QUALIFIED = 1,    // Has been pre-qualified but not engaged
  HOOK = 2,             // Initial message sent, introduction made
  VALUE_PROPOSITION = 3, // Value proposition presented
  QUESTIONS_ASKED = 4,   // Questions asked to the lead
  ENGAGED = 5,          // Lead has engaged in conversation
  QUALIFIED = 6,        // Lead qualified for further action
  CLARIFYING = 7,       // In clarifying loop with lead
  ON_HOLD = 8,          // Temporarily on hold
  FOLLOW_UP = 9,        // Scheduled for follow up
  BOOKED = 10,          // Meeting or action booked
  DEAD = 11             // No further action possible
}

export type LeadTemperature = 'Cold' | 'Cool' | 'Warm' | 'Hot' | 'Scheduled';

export interface LeadState {
  value: LeadStatusValue;
  label: string;
  description: string;
  color: string;
  temperature: LeadTemperature;
  nextSteps: LeadStatusValue[];
  maxTimeInState?: number; // In hours, for cadence rules
  reminderInterval?: number; // In hours, for follow-ups
}

export const leadStates: Record<LeadStatusValue, LeadState> = {
  [LeadStatusValue.NEW]: {
    value: LeadStatusValue.NEW,
    label: 'New',
    description: 'Lead has been added to the system but not yet contacted',
    color: '#B0BEC5', // gray
    temperature: 'Cold',
    nextSteps: [LeadStatusValue.PRE_QUALIFIED, LeadStatusValue.HOOK],
    maxTimeInState: 24 // Maximum 24 hours in NEW state
  },
  [LeadStatusValue.PRE_QUALIFIED]: {
    value: LeadStatusValue.PRE_QUALIFIED,
    label: 'Pre-Qualified',
    description: 'Lead has been reviewed and pre-qualified for outreach',
    color: '#B0BEC5', // gray
    temperature: 'Cold',
    nextSteps: [LeadStatusValue.HOOK],
    maxTimeInState: 48
  },
  [LeadStatusValue.HOOK]: {
    value: LeadStatusValue.HOOK,
    label: 'Hook',
    description: 'Initial contact made with lead',
    color: '#64B5F6', // light blue
    temperature: 'Cool',
    nextSteps: [LeadStatusValue.VALUE_PROPOSITION, LeadStatusValue.DEAD],
    maxTimeInState: 24,
    reminderInterval: 8 // Remind after 8 hours if no response
  },
  [LeadStatusValue.VALUE_PROPOSITION]: {
    value: LeadStatusValue.VALUE_PROPOSITION,
    label: 'Value Proposition',
    description: 'Value proposition has been shared with the lead',
    color: '#64B5F6', // light blue
    temperature: 'Cool',
    nextSteps: [LeadStatusValue.QUESTIONS_ASKED, LeadStatusValue.ENGAGED, LeadStatusValue.DEAD],
    maxTimeInState: 24,
    reminderInterval: 12
  },
  [LeadStatusValue.QUESTIONS_ASKED]: {
    value: LeadStatusValue.QUESTIONS_ASKED,
    label: 'Questions Asked',
    description: 'Questions have been asked to gauge lead interest and fit',
    color: '#64B5F6', // light blue
    temperature: 'Cool',
    nextSteps: [LeadStatusValue.ENGAGED, LeadStatusValue.ON_HOLD, LeadStatusValue.DEAD],
    maxTimeInState: 48,
    reminderInterval: 24
  },
  [LeadStatusValue.ENGAGED]: {
    value: LeadStatusValue.ENGAGED,
    label: 'Engaged',
    description: 'Lead is actively engaging in conversation',
    color: '#FFB74D', // orange
    temperature: 'Warm',
    nextSteps: [LeadStatusValue.QUALIFIED, LeadStatusValue.CLARIFYING, LeadStatusValue.ON_HOLD, LeadStatusValue.DEAD],
    reminderInterval: 4
  },
  [LeadStatusValue.QUALIFIED]: {
    value: LeadStatusValue.QUALIFIED,
    label: 'Qualified',
    description: 'Lead has been qualified as a good fit',
    color: '#FFB74D', // orange
    temperature: 'Warm',
    nextSteps: [LeadStatusValue.BOOKED, LeadStatusValue.FOLLOW_UP, LeadStatusValue.CLARIFYING, LeadStatusValue.DEAD]
  },
  [LeadStatusValue.CLARIFYING]: {
    value: LeadStatusValue.CLARIFYING,
    label: 'Clarifying',
    description: 'In clarification loop with lead to address questions/concerns',
    color: '#FFB74D', // orange
    temperature: 'Warm',
    nextSteps: [LeadStatusValue.QUALIFIED, LeadStatusValue.BOOKED, LeadStatusValue.ON_HOLD, LeadStatusValue.DEAD],
    reminderInterval: 12
  },
  [LeadStatusValue.ON_HOLD]: {
    value: LeadStatusValue.ON_HOLD,
    label: 'On Hold',
    description: 'Lead communication temporarily paused',
    color: '#B0BEC5', // gray
    temperature: 'Cold',
    nextSteps: [LeadStatusValue.FOLLOW_UP, LeadStatusValue.DEAD],
    maxTimeInState: 168 // 7 days max
  },
  [LeadStatusValue.FOLLOW_UP]: {
    value: LeadStatusValue.FOLLOW_UP,
    label: 'Follow-Up',
    description: 'Scheduled for follow-up at a later time',
    color: '#64B5F6', // light blue
    temperature: 'Cool',
    nextSteps: [LeadStatusValue.ENGAGED, LeadStatusValue.QUALIFIED, LeadStatusValue.BOOKED, LeadStatusValue.DEAD],
    reminderInterval: 48 // 2 days
  },
  [LeadStatusValue.BOOKED]: {
    value: LeadStatusValue.BOOKED,
    label: 'Booked',
    description: 'Meeting or action has been booked',
    color: '#8E24AA', // purple
    temperature: 'Scheduled',
    nextSteps: [LeadStatusValue.DEAD]
  },
  [LeadStatusValue.DEAD]: {
    value: LeadStatusValue.DEAD,
    label: 'Dead',
    description: 'Lead is no longer pursuable',
    color: '#E53935', // red
    temperature: 'Cold',
    nextSteps: [] // No next steps from DEAD
  }
};

/**
 * Helper functions for working with lead states
 */

/**
 * Get a LeadState object from a numeric status value
 */
export const getLeadStateByValue = (value: number): LeadState => {
  return leadStates[value as LeadStatusValue] || leadStates[LeadStatusValue.NEW];
};

/**
 * Get the appropriate temperature color for display
 */
export const getTemperatureColor = (temperature: LeadTemperature): string => {
  switch (temperature) {
    case 'Cold': return '#B0BEC5';
    case 'Cool': return '#64B5F6';
    case 'Warm': return '#FFB74D';
    case 'Hot': return '#E53935';
    case 'Scheduled': return '#8E24AA';
    default: return '#B0BEC5';
  }
};

/**
 * Get the CSS class for temperature visualization 
 */
export const getTemperatureClass = (temperature: LeadTemperature): string => {
  switch (temperature) {
    case 'Cold': return 'bg-temperature-cold'; 
    case 'Cool': return 'bg-temperature-cool';
    case 'Warm': return 'bg-temperature-warm';
    case 'Hot': return 'bg-temperature-hot';
    case 'Scheduled': return 'bg-temperature-scheduled';
    default: return 'bg-temperature-cold';
  }
};

/**
 * Check if a transition between states is valid
 */
export const isValidTransition = (
  currentState: LeadStatusValue, 
  nextState: LeadStatusValue
): boolean => {
  const state = leadStates[currentState];
  return state.nextSteps.includes(nextState);
};

/**
 * Get all possible next states from current state
 */
export const getNextPossibleStates = (currentState: LeadStatusValue): LeadState[] => {
  const state = leadStates[currentState];
  return state.nextSteps.map(stateValue => leadStates[stateValue]);
};
