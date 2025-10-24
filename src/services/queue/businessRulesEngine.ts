/**
 * Business Rules Engine for Leads Queue
 * Simplified version that enforces Israeli business hours, Jewish holidays, and basic validation
 */

import { addDays, format, getDay } from 'date-fns';
import {
  BusinessHours,
  QueueOperation,
  ValidationResult,
  Holiday,
  BusinessRuleError
} from '@/types/queue';

export class BusinessRulesEngine {
  private readonly ISRAEL_TIMEZONE = 'Asia/Jerusalem';
  private readonly DEFAULT_BUSINESS_HOURS: BusinessHours = {
    sunday: { start: '09:00', end: '17:00', enabled: true },
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '13:00', enabled: false },
    saturday: { enabled: false },
  };

  private readonly JEWISH_HOLIDAYS_2024: Holiday[] = [
    { date: '2024-04-22', name: 'Passover (Pesach)', type: 'jewish' },
    { date: '2024-04-23', name: 'Passover (Pesach)', type: 'jewish' },
    { date: '2024-04-29', name: 'Passover (Pesach) - Last Day', type: 'jewish' },
    { date: '2024-05-14', name: 'Independence Day (Yom Ha\'atzmaut)', type: 'national' },
    { date: '2024-06-12', name: 'Shavuot', type: 'jewish' },
    { date: '2024-09-16', name: 'Rosh Hashanah', type: 'jewish' },
    { date: '2024-09-17', name: 'Rosh Hashanah', type: 'jewish' },
    { date: '2024-09-25', name: 'Yom Kippur', type: 'jewish' },
    { date: '2024-09-30', name: 'Sukkot', type: 'jewish' },
    { date: '2024-10-07', name: 'Simchat Torah', type: 'jewish' },
  ];

  /**
   * Validate a queue operation against basic business rules
   */
  async validateOperation(
    operation: QueueOperation,
    userId: string
  ): Promise<ValidationResult> {
    try {
      // Check basic business rules
      const checks = [
        this.checkBusinessHours(operation.scheduledFor),
        this.checkHolidays(operation.scheduledFor),
        this.checkBasicLimits(operation.leadIds.length),
      ];

      // Find the first failed check
      const failedCheck = checks.find(check => !check.allowed);
      if (failedCheck) {
        return failedCheck;
      }

      // Check for warnings
      const warnings = checks
        .filter(check => check.warning)
        .map(check => check.warning!)
        .join('; ');

      return {
        allowed: true,
        warning: warnings || undefined,
      };
    } catch (error) {
      console.error('Business rules validation error:', error);
      return {
        allowed: false,
        reason: 'Failed to validate business rules',
      };
    }
  }

  /**
   * Check if the scheduled time is within business hours
   */
  private checkBusinessHours(
    scheduledFor?: Date,
    businessHours: BusinessHours = this.DEFAULT_BUSINESS_HOURS
  ): ValidationResult {
    const targetTime = scheduledFor || new Date();
    // For now, using local time. TODO: Implement proper timezone handling
    const israelTime = targetTime;
    
    const dayOfWeek = getDay(israelTime);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof BusinessHours;
    const dayRules = businessHours[dayName];

    if (!dayRules.enabled) {
      return {
        allowed: false,
        reason: `Cannot schedule for ${dayName} - business closed`,
      };
    }

    // Handle days that might not have start/end times (like saturday)
    if (!('start' in dayRules) || !('end' in dayRules)) {
      return {
        allowed: false,
        reason: `Cannot schedule for ${dayName} - no business hours defined`,
      };
    }

    const hours = israelTime.getHours();
    const minutes = israelTime.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    if (timeString < dayRules.start || timeString > dayRules.end) {
      return {
        allowed: false,
        reason: `Outside business hours (${dayRules.start}-${dayRules.end} IST)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if scheduled time falls on a holiday
   */
  private checkHolidays(
    scheduledFor?: Date,
    excludeHolidays: boolean = true,
    customHolidays: string[] = []
  ): ValidationResult {
    if (!excludeHolidays) {
      return { allowed: true };
    }

    const targetDate = format(scheduledFor || new Date(), 'yyyy-MM-dd');
    
    // Check Jewish holidays
    const isJewishHoliday = this.JEWISH_HOLIDAYS_2024.some(
      holiday => holiday.date === targetDate
    );

    if (isJewishHoliday) {
      const holiday = this.JEWISH_HOLIDAYS_2024.find(h => h.date === targetDate);
      return {
        allowed: false,
        reason: `Cannot schedule on holiday: ${holiday?.name}`,
      };
    }

    // Check custom holidays
    if (customHolidays.includes(targetDate)) {
      return {
        allowed: false,
        reason: 'Cannot schedule on custom holiday',
      };
    }

    return { allowed: true };
  }

  /**
   * Check basic limits (simplified version)
   */
  private checkBasicLimits(leadCount: number): ValidationResult {
    const MAX_BATCH_SIZE = 100;
    const MAX_DAILY_CAPACITY = 200;

    if (leadCount > MAX_BATCH_SIZE) {
      return {
        allowed: false,
        reason: `Batch size too large (${leadCount}/${MAX_BATCH_SIZE})`,
      };
    }

    if (leadCount > MAX_DAILY_CAPACITY * 0.8) {
      return {
        allowed: true,
        warning: `Large batch size (${leadCount} leads)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if current time is within business hours
   */
  async isBusinessHours(userId: string): Promise<boolean> {
    const result = this.checkBusinessHours(new Date(), this.DEFAULT_BUSINESS_HOURS);
    return result.allowed;
  }

  /**
   * Get next available business hour slot
   */
  async getNextBusinessHourSlot(userId: string): Promise<Date> {
    const now = new Date();
    let checkDate = new Date(now);

    // Look up to 7 days ahead
    for (let i = 0; i < 7; i++) {
      const result = this.checkBusinessHours(checkDate, this.DEFAULT_BUSINESS_HOURS);
      if (result.allowed) {
        return checkDate;
      }

      // Move to next business day start
      checkDate = addDays(checkDate, 1);
      checkDate.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    // Fallback: return tomorrow at 9 AM
    const tomorrow = addDays(now, 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Validate and auto-schedule leads for optimal time
   */
  async autoScheduleLeads(
    leadIds: string[],
    userId: string,
    priority: 'low' | 'normal' | 'high' | 'immediate' = 'normal'
  ): Promise<Date[]> {
    const schedules: Date[] = [];
    let currentSlot = await this.getNextBusinessHourSlot(userId);

    for (let i = 0; i < leadIds.length; i++) {
      // For immediate priority, schedule ASAP
      if (priority === 'immediate') {
        schedules.push(new Date(currentSlot));
        continue;
      }

      // Apply 2-minute delay between messages
      if (i > 0) {
        currentSlot = new Date(currentSlot.getTime() + 2 * 60 * 1000);
      }

      // Check if still in business hours, if not, move to next slot
      const validation = this.checkBusinessHours(currentSlot, this.DEFAULT_BUSINESS_HOURS);
      if (!validation.allowed) {
        currentSlot = await this.getNextBusinessHourSlot(userId);
      }

      schedules.push(new Date(currentSlot));
    }

    return schedules;
  }

  /**
   * Create a business rule error
   */
  createError(message: string, code: string = 'BUSINESS_RULE_VIOLATION'): BusinessRuleError {
    return new BusinessRuleError(message, { code });
  }
}

// Export singleton instance
export const businessRulesEngine = new BusinessRulesEngine(); 