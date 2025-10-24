/**
 * Business Days Service
 * Provides utilities for calculating business days, holidays, and work schedules
 * based on user queue management settings.
 */

import { UserQueueManagementSettings } from './userPreferencesService';

export interface BusinessDayInfo {
  isBusinessDay: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  nextBusinessDay: Date;
  businessDaysInMonth: number;
  businessDaysRemaining: number;
}

export class BusinessDaysService {
  
  /**
   * Check if a given date is a business day
   */
  static isBusinessDay(date: Date, settings: UserQueueManagementSettings): boolean {
    if (!settings.work_days.enabled) {
      return true; // If work days not enabled, every day is a business day
    }

    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Check if it's a work day
    if (!settings.work_days.work_days.includes(dayOfWeek)) {
      return false;
    }

    // Check if it's a holiday
    if (settings.work_days.exclude_holidays) {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (settings.work_days.custom_holidays.includes(dateString)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the next business day from a given date
   */
  static getNextBusinessDay(date: Date, settings: UserQueueManagementSettings): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Keep checking until we find a business day
    while (!this.isBusinessDay(nextDay, settings)) {
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Safety check to prevent infinite loops
      const diffInDays = (nextDay.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diffInDays > 14) {
        console.warn('BusinessDaysService: Could not find next business day within 14 days, returning original date + 1');
        return new Date(date.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    return nextDay;
  }

  /**
   * Get the previous business day from a given date
   */
  static getPreviousBusinessDay(date: Date, settings: UserQueueManagementSettings): Date {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);

    while (!this.isBusinessDay(prevDay, settings)) {
      prevDay.setDate(prevDay.getDate() - 1);
      
      // Safety check
      const diffInDays = (date.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24);
      if (diffInDays > 14) {
        console.warn('BusinessDaysService: Could not find previous business day within 14 days, returning original date - 1');
        return new Date(date.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    return prevDay;
  }

  /**
   * Count business days in a given month
   */
  static getBusinessDaysInMonth(year: number, month: number, settings: UserQueueManagementSettings): number {
    let count = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (this.isBusinessDay(date, settings)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Count remaining business days in current month
   */
  static getRemainingBusinessDaysInMonth(settings: UserQueueManagementSettings): number {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDay = today.getDate();
    
    let count = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = currentDay; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (this.isBusinessDay(date, settings)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate appropriate daily processing target based on monthly target and remaining business days
   */
  static calculateDailyTarget(settings: UserQueueManagementSettings, date: Date = new Date()): number {
    const monthlyTarget = settings.processing_targets.target_leads_per_month;
    const configuredDailyTarget = settings.processing_targets.target_leads_per_work_day;
    
    // If there's a manual override, use it
    if (settings.processing_targets.override_daily_target) {
      return Math.min(
        settings.processing_targets.override_daily_target, 
        settings.processing_targets.max_daily_capacity
      );
    }

    // Check if it's a weekend and weekend processing is enabled
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend && settings.processing_targets.weekend_processing.enabled) {
      const weekendTarget = Math.floor(
        configuredDailyTarget * (settings.processing_targets.weekend_processing.reduced_target_percentage / 100)
      );
      return Math.min(weekendTarget, settings.processing_targets.max_daily_capacity);
    }

    // If it's not a business day and weekend processing is disabled, return 0
    if (!this.isBusinessDay(date, settings)) {
      return 0;
    }

    // For business days, use the configured daily target
    return Math.min(configuredDailyTarget, settings.processing_targets.max_daily_capacity);
  }

  /**
   * Get comprehensive business day information for a date
   */
  static getBusinessDayInfo(date: Date, settings: UserQueueManagementSettings): BusinessDayInfo {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateString = date.toISOString().split('T')[0];
    const isHoliday = settings.work_days.exclude_holidays && 
                     settings.work_days.custom_holidays.includes(dateString);
    
    return {
      isBusinessDay: this.isBusinessDay(date, settings),
      isHoliday,
      isWeekend,
      nextBusinessDay: this.getNextBusinessDay(date, settings),
      businessDaysInMonth: this.getBusinessDaysInMonth(date.getFullYear(), date.getMonth(), settings),
      businessDaysRemaining: this.getRemainingBusinessDaysInMonth(settings),
    };
  }

  /**
   * Check if current time is within business hours
   */
  static isWithinBusinessHours(settings: UserQueueManagementSettings, date: Date = new Date()): boolean {
    if (!settings.work_days.enabled) {
      return true;
    }

    const timeString = date.toTimeString().substring(0, 5); // HH:MM format
    const { start, end } = settings.work_days.business_hours;

    return timeString >= start && timeString <= end;
  }

  /**
   * Get the next time when processing should start (considering business hours)
   */
  static getNextProcessingTime(settings: UserQueueManagementSettings): Date {
    const now = new Date();
    
    // If work days are disabled, return current time
    if (!settings.work_days.enabled) {
      return now;
    }

    // Check if it's currently a business day
    if (this.isBusinessDay(now, settings)) {
      // Check if we're within business hours
      if (this.isWithinBusinessHours(settings, now)) {
        return now; // Can process now
      }
      
      // If after business hours, schedule for next business day at start time
      const nextBusinessDay = this.getNextBusinessDay(now, settings);
      const [startHour, startMinute] = settings.work_days.business_hours.start.split(':').map(Number);
      nextBusinessDay.setHours(startHour, startMinute, 0, 0);
      return nextBusinessDay;
    }

    // If not a business day, find next business day and set to start time
    const nextBusinessDay = this.getNextBusinessDay(now, settings);
    const [startHour, startMinute] = settings.work_days.business_hours.start.split(':').map(Number);
    nextBusinessDay.setHours(startHour, startMinute, 0, 0);
    return nextBusinessDay;
  }

  /**
   * Validate queue management settings
   */
  static validateSettings(settings: UserQueueManagementSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate work days
    if (settings.work_days.enabled) {
      if (!settings.work_days.work_days || settings.work_days.work_days.length === 0) {
        errors.push('At least one work day must be selected');
      }

      if (settings.work_days.work_days.some(day => day < 0 || day > 6)) {
        errors.push('Work days must be between 0 (Sunday) and 6 (Saturday)');
      }

      // Validate business hours
      const { start, end } = settings.work_days.business_hours;
      if (start >= end) {
        errors.push('Business hours start time must be before end time');
      }
    }

    // Validate processing targets
    if (settings.processing_targets.target_leads_per_month <= 0) {
      errors.push('Monthly target must be greater than 0');
    }

    if (settings.processing_targets.target_leads_per_work_day <= 0) {
      errors.push('Daily target must be greater than 0');
    }

    if (settings.processing_targets.max_daily_capacity < settings.processing_targets.target_leads_per_work_day) {
      errors.push('Max daily capacity must be at least equal to daily target');
    }

    // Validate automation settings
    if (settings.automation.queue_preparation_time === settings.automation.processing_start_time) {
      errors.push('Queue preparation time and processing start time should be different');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate recommended daily target based on monthly goal and work schedule
   */
  static calculateRecommendedDailyTarget(
    monthlyTarget: number, 
    settings: UserQueueManagementSettings,
    targetMonth?: { year: number; month: number }
  ): {
    recommendedDailyTarget: number;
    businessDaysInMonth: number;
    bufferDays: number;
    analysis: {
      isAggressive: boolean;
      isConservative: boolean;
      feasibilityScore: number; // 0-100, higher is more feasible
      recommendations: string[];
    };
  } {
    const today = new Date();
    const year = targetMonth?.year || today.getFullYear();
    const month = targetMonth?.month || today.getMonth();

    const businessDaysInMonth = this.getBusinessDaysInMonth(year, month, settings);
    
    // Calculate basic daily target (with 10% buffer for flexibility)
    const basicDailyTarget = Math.ceil(monthlyTarget / businessDaysInMonth);
    const bufferDays = Math.floor(businessDaysInMonth * 0.1); // 10% buffer
    const effectiveBusinessDays = businessDaysInMonth - bufferDays;
    const recommendedDailyTarget = Math.ceil(monthlyTarget / effectiveBusinessDays);

    // Analysis
    const analysis = {
      isAggressive: recommendedDailyTarget > settings.processing_targets.max_daily_capacity * 0.8,
      isConservative: recommendedDailyTarget < settings.processing_targets.max_daily_capacity * 0.3,
      feasibilityScore: 0,
      recommendations: [] as string[],
    };

    // Calculate feasibility score
    const capacityUtilization = recommendedDailyTarget / settings.processing_targets.max_daily_capacity;
    
    if (capacityUtilization <= 0.6) {
      analysis.feasibilityScore = 100; // Very feasible
    } else if (capacityUtilization <= 0.8) {
      analysis.feasibilityScore = 80; // Feasible
    } else if (capacityUtilization <= 1.0) {
      analysis.feasibilityScore = 60; // Challenging but possible
    } else if (capacityUtilization <= 1.2) {
      analysis.feasibilityScore = 30; // Very challenging
    } else {
      analysis.feasibilityScore = 10; // Nearly impossible with current settings
    }

    // Generate recommendations
    if (analysis.isAggressive) {
      analysis.recommendations.push('Consider increasing max daily capacity or extending work days');
      analysis.recommendations.push('Enable weekend processing with reduced capacity');
      analysis.recommendations.push('Review automation settings to increase processing efficiency');
    }

    if (capacityUtilization > 1.0) {
      analysis.recommendations.push(`Daily target exceeds max capacity by ${Math.round((capacityUtilization - 1) * 100)}%`);
      analysis.recommendations.push('Increase max daily capacity or reduce monthly target');
    }

    if (bufferDays < 2) {
      analysis.recommendations.push('Consider adding more buffer days for unexpected delays');
    }

    if (analysis.isConservative) {
      analysis.recommendations.push('You have significant capacity remaining - could increase monthly target');
    }

    // Check for weekend processing potential
    if (!settings.processing_targets.weekend_processing.enabled && capacityUtilization > 0.7) {
      const weekendsInMonth = this.getWeekendsInMonth(year, month);
      const weekendCapacity = weekendsInMonth * 2 * Math.floor(recommendedDailyTarget * 0.3); // 30% capacity on weekends
      analysis.recommendations.push(`Enabling weekend processing could add ${weekendCapacity} monthly capacity`);
    }

    return {
      recommendedDailyTarget,
      businessDaysInMonth,
      bufferDays,
      analysis,
    };
  }

  /**
   * Count weekends in a given month
   */
  private static getWeekendsInMonth(year: number, month: number): number {
    let weekends = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends++;
      }
    }

    return Math.floor(weekends / 2); // Count weekend pairs
  }

  /**
   * Optimize work schedule for a given monthly target
   */
  static optimizeWorkSchedule(
    monthlyTarget: number,
    maxDailyCapacity: number,
    constraints: {
      mustIncludeWeekends?: boolean;
      maxWorkDaysPerWeek?: number;
      minWorkDaysPerWeek?: number;
      excludeSpecificDays?: number[]; // Day numbers to exclude (0=Sunday, etc.)
    } = {}
  ): {
    optimizedSchedule: {
      workDays: number[];
      dailyTarget: number;
      weekendTarget?: number;
    };
    projectedMonthlyCapacity: number;
    utilizationRate: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Start with Mon-Fri (1,2,3,4,5)
    let workDays = [1, 2, 3, 4, 5];
    
    // Apply constraints
    if (constraints.excludeSpecificDays) {
      workDays = workDays.filter(day => !constraints.excludeSpecificDays!.includes(day));
    }

    // Estimate business days per month (average 22 for Mon-Fri)
    const avgBusinessDaysPerMonth = workDays.length * 4.33; // ~4.33 weeks per month
    let dailyTarget = Math.ceil(monthlyTarget / avgBusinessDaysPerMonth);
    
    // Check if we need weekends
    if (dailyTarget > maxDailyCapacity || constraints.mustIncludeWeekends) {
      // Add weekends with reduced capacity
      if (!workDays.includes(0)) workDays.push(0); // Sunday
      if (!workDays.includes(6)) workDays.push(6); // Saturday
      
      const weekdayTarget = Math.min(maxDailyCapacity, Math.ceil(monthlyTarget * 0.7 / (avgBusinessDaysPerMonth)));
      const weekendTarget = Math.min(
        Math.floor(maxDailyCapacity * 0.5), // 50% capacity on weekends
        Math.ceil(monthlyTarget * 0.3 / 8) // 30% of target across 8 weekend days
      );
      
      dailyTarget = weekdayTarget;
      
      recommendations.push('Weekend processing recommended to meet monthly target');
      recommendations.push(`Suggested weekend capacity: ${weekendTarget} leads/day`);
    }

    // Validate against capacity constraints
    if (dailyTarget > maxDailyCapacity) {
      recommendations.push('Daily target exceeds maximum capacity - consider increasing capacity');
      dailyTarget = maxDailyCapacity;
    }

    // Calculate projected capacity
    const weekdaysPerMonth = workDays.filter(day => day >= 1 && day <= 5).length * 4.33;
    const weekendsPerMonth = workDays.filter(day => day === 0 || day === 6).length * 4.33;
    
    const projectedMonthlyCapacity = 
      (weekdaysPerMonth * dailyTarget) + 
      (weekendsPerMonth * (dailyTarget * 0.5)); // Assume 50% weekend capacity

    const utilizationRate = projectedMonthlyCapacity > 0 ? (monthlyTarget / projectedMonthlyCapacity) * 100 : 0;

    // Add utilization-based recommendations
    if (utilizationRate > 90) {
      recommendations.push('High utilization rate - consider adding buffer capacity');
    } else if (utilizationRate < 60) {
      recommendations.push('Low utilization rate - could handle higher targets');
    }

    return {
      optimizedSchedule: {
        workDays: workDays.sort(),
        dailyTarget,
        weekendTarget: workDays.includes(0) || workDays.includes(6) ? 
          Math.floor(dailyTarget * 0.5) : undefined,
      },
      projectedMonthlyCapacity: Math.floor(projectedMonthlyCapacity),
      utilizationRate,
      recommendations,
    };
  }

  /**
   * Calculate target achievement projection for remaining month
   */
  static calculateTargetProjection(
    currentProgress: number,
    monthlyTarget: number,
    settings: UserQueueManagementSettings
  ): {
    projectedCompletion: number;
    projectedCompletionPercentage: number;
    onTrack: boolean;
    requiredDailyRate: number;
    currentDailyRate: number;
    daysRemaining: number;
    businessDaysRemaining: number;
    recommendations: string[];
  } {
    const today = new Date();
    const businessDaysRemaining = this.getRemainingBusinessDaysInMonth(settings);
    const daysPassedInMonth = today.getDate();
    const daysRemainingInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
    
    const currentDailyRate = daysPassedInMonth > 0 ? currentProgress / daysPassedInMonth : 0;
    const requiredDailyRate = businessDaysRemaining > 0 ? 
      (monthlyTarget - currentProgress) / businessDaysRemaining : 0;

    const projectedCompletion = currentProgress + (currentDailyRate * daysRemainingInMonth);
    const projectedCompletionPercentage = monthlyTarget > 0 ? 
      (projectedCompletion / monthlyTarget) * 100 : 0;

    const onTrack = projectedCompletionPercentage >= 95; // Within 5% is considered on track

    const recommendations: string[] = [];

    if (!onTrack) {
      const shortfall = monthlyTarget - projectedCompletion;
      recommendations.push(`Projected to miss target by ${Math.round(shortfall)} leads (${Math.round(100 - projectedCompletionPercentage)}%)`);
      
      if (requiredDailyRate > settings.processing_targets.max_daily_capacity) {
        recommendations.push('Required daily rate exceeds max capacity - target may not be achievable');
        recommendations.push('Consider enabling weekend processing or extending work hours');
      } else {
        recommendations.push(`Increase daily processing to ${Math.ceil(requiredDailyRate)} leads to stay on track`);
      }
    } else if (projectedCompletionPercentage > 110) {
      recommendations.push('Ahead of schedule - could reduce daily target or increase monthly goal');
    }

    if (currentDailyRate < settings.processing_targets.target_leads_per_work_day * 0.8) {
      recommendations.push('Current daily rate is below target - review processing efficiency');
    }

    return {
      projectedCompletion: Math.round(projectedCompletion),
      projectedCompletionPercentage: Math.round(projectedCompletionPercentage * 10) / 10,
      onTrack,
      requiredDailyRate: Math.round(requiredDailyRate * 10) / 10,
      currentDailyRate: Math.round(currentDailyRate * 10) / 10,
      daysRemaining: daysRemainingInMonth,
      businessDaysRemaining,
      recommendations,
    };
  }
} 