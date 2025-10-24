
/**
 * Message Cadence Rules
 * 
 * This file defines rules for messaging frequency and timing.
 */

import { LeadStatusValue } from './leadStates';

// Quiet hours - no messages sent during these times (local lead time)
export const quietHours = {
  start: 22, // 10 PM
  end: 8,    // 8 AM
  weekend: true // respect weekend quiet hours (all day)
};

// Maximum messages per day by lead status
export const maxMessagesPerDay: Record<LeadStatusValue, number> = {
  [LeadStatusValue.NEW]: 1,
  [LeadStatusValue.PRE_QUALIFIED]: 1,
  [LeadStatusValue.HOOK]: 2,
  [LeadStatusValue.VALUE_PROPOSITION]: 3,
  [LeadStatusValue.QUESTIONS_ASKED]: 3,
  [LeadStatusValue.ENGAGED]: 5,
  [LeadStatusValue.QUALIFIED]: 4,
  [LeadStatusValue.CLARIFYING]: 5,
  [LeadStatusValue.ON_HOLD]: 0,
  [LeadStatusValue.FOLLOW_UP]: 1,
  [LeadStatusValue.BOOKED]: 1,
  [LeadStatusValue.DEAD]: 0,
};

// Minimum time between messages in hours (prevents bombarding leads)
export const minTimeBetweenMessages: Record<LeadStatusValue, number> = {
  [LeadStatusValue.NEW]: 0,
  [LeadStatusValue.PRE_QUALIFIED]: 0,
  [LeadStatusValue.HOOK]: 2,
  [LeadStatusValue.VALUE_PROPOSITION]: 2,
  [LeadStatusValue.QUESTIONS_ASKED]: 3,
  [LeadStatusValue.ENGAGED]: 0.5, // 30 minutes
  [LeadStatusValue.QUALIFIED]: 1,
  [LeadStatusValue.CLARIFYING]: 1,
  [LeadStatusValue.ON_HOLD]: 24,
  [LeadStatusValue.FOLLOW_UP]: 24,
  [LeadStatusValue.BOOKED]: 24,
  [LeadStatusValue.DEAD]: 0,
};

// Response timers - if lead responds, how quickly should agent respond (in minutes)
export const responseTimeTargets: Record<LeadStatusValue, number> = {
  [LeadStatusValue.NEW]: 30,
  [LeadStatusValue.PRE_QUALIFIED]: 30,
  [LeadStatusValue.HOOK]: 15,
  [LeadStatusValue.VALUE_PROPOSITION]: 15,
  [LeadStatusValue.QUESTIONS_ASKED]: 15,
  [LeadStatusValue.ENGAGED]: 5,
  [LeadStatusValue.QUALIFIED]: 5,
  [LeadStatusValue.CLARIFYING]: 10,
  [LeadStatusValue.ON_HOLD]: 60,
  [LeadStatusValue.FOLLOW_UP]: 30,
  [LeadStatusValue.BOOKED]: 30,
  [LeadStatusValue.DEAD]: 0,
};

// Follow-up delays after no response (in hours) - when to try again
export const followUpDelays = {
  initial: 4,      // First follow-up after 4 hours
  second: 24,      // Second follow-up after 24 hours
  third: 72,       // Third follow-up after 3 days
  final: 168,      // Final attempt after 7 days
  beforeDead: 336  // Mark as DEAD after 14 days of no response
};

// Special handling for holidays/weekends
export const specialDays = {
  weekends: {
    delay: true, // Delay messages to next business day
    exception: [LeadStatusValue.ENGAGED, LeadStatusValue.QUALIFIED] // States where weekend messages are still allowed
  },
  holidays: {
    delay: true // Always delay on holidays
  }
};

// Helper function to check if a message should be sent based on time rules
export const shouldSendMessage = (
  leadStatus: LeadStatusValue,
  leadLocalTime: Date,
  messagesSentToday: number,
  lastMessageTimestamp?: Date
): { allowed: boolean; reason?: string } => {
  const hour = leadLocalTime.getHours();
  
  // Check quiet hours
  if (hour >= quietHours.start || hour < quietHours.end) {
    return { allowed: false, reason: "Outside messaging hours" };
  }

  // Check weekends if applicable
  if (
    quietHours.weekend && 
    (leadLocalTime.getDay() === 0 || leadLocalTime.getDay() === 6) && 
    !specialDays.weekends.exception.includes(leadStatus)
  ) {
    return { allowed: false, reason: "Weekend quiet hours" };
  }

  // Check max messages per day
  if (messagesSentToday >= maxMessagesPerDay[leadStatus]) {
    return { allowed: false, reason: "Daily message limit reached" };
  }

  // Check minimum time between messages
  if (lastMessageTimestamp) {
    const hoursSinceLastMessage = 
      (leadLocalTime.getTime() - lastMessageTimestamp.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastMessage < minTimeBetweenMessages[leadStatus]) {
      return { allowed: false, reason: "Minimum time between messages not elapsed" };
    }
  }

  return { allowed: true };
};
