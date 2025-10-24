/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common field validators
 */
export class FieldValidators {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[\d\s\-()]{7,15}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Validate required string field
   */
  static validateRequiredString(value: string | null | undefined, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (!value || value.trim().length === 0) {
      errors.push(`${fieldName} is required`);
    }
    
    return errors;
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string, 
    fieldName: string, 
    minLength?: number, 
    maxLength?: number
  ): string[] {
    const errors: string[] = [];
    
    if (minLength && value.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters`);
    }
    
    if (maxLength && value.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }
    
    return errors;
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date format and range
   */
  static validateDate(dateString: string, fieldName: string): string[] {
    const errors: string[] = [];
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} must be a valid date`);
    }
    
    return errors;
  }

  /**
   * Validate number range
   */
  static validateNumberRange(
    value: number, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): string[] {
    const errors: string[] = [];
    
    if (min !== undefined && value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }
    
    if (max !== undefined && value > max) {
      errors.push(`${fieldName} must be no more than ${max}`);
    }
    
    return errors;
  }
}

/**
 * Entity-specific validators
 */
export class EntityValidators {
  /**
   * Validate client data
   */
  static validateClient(client: any): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (client.name !== undefined) {
      errors.push(...FieldValidators.validateRequiredString(client.name, 'Client name'));
      if (client.name) {
        errors.push(...FieldValidators.validateStringLength(client.name, 'Client name', undefined, 255));
      }
    }

    // Validate email
    if (client.contact_info?.email && !FieldValidators.validateEmail(client.contact_info.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone
    if (client.whatsapp_phone_number && !FieldValidators.validatePhoneNumber(client.whatsapp_phone_number)) {
      errors.push('Invalid WhatsApp phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate lead data
   */
  static validateLead(lead: any): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    errors.push(...FieldValidators.validateRequiredString(lead.firstName, 'First name'));
    errors.push(...FieldValidators.validateRequiredString(lead.lastName, 'Last name'));
    // Email is optional - only validate format if provided

    // Validate email format
    if (lead.email && !FieldValidators.validateEmail(lead.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone if provided
    if (lead.phone && !FieldValidators.validatePhoneNumber(lead.phone)) {
      errors.push('Invalid phone number format');
    }

    // Validate status
    const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'MEETING_SCHEDULED', 'CLOSED_WON', 'CLOSED_LOST'];
    if (lead.status && !validStatuses.includes(lead.status)) {
      errors.push('Invalid lead status');
    }

    // Validate temperature
    if (lead.temperature !== undefined) {
      errors.push(...FieldValidators.validateNumberRange(lead.temperature, 'Temperature', 0, 100));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate project data
   */
  static validateProject(project: any): ValidationResult {
    const errors: string[] = [];

    // Validate name
    errors.push(...FieldValidators.validateRequiredString(project.name, 'Project name'));
    if (project.name) {
      errors.push(...FieldValidators.validateStringLength(project.name, 'Project name', undefined, 255));
    }

    // Validate client_id
    errors.push(...FieldValidators.validateRequiredString(project.client_id, 'Client ID'));

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED'];
    if (project.status && !validStatuses.includes(project.status)) {
      errors.push('Invalid project status');
    }

    // Validate dates
    if (project.start_date) {
      errors.push(...FieldValidators.validateDate(project.start_date, 'Start date'));
    }

    if (project.end_date) {
      errors.push(...FieldValidators.validateDate(project.end_date, 'End date'));
    }

    // Validate date range
    if (project.start_date && project.end_date) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);
      
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate message data
   */
  static validateMessage(message: any): ValidationResult {
    const errors: string[] = [];

    // Validate content
    errors.push(...FieldValidators.validateRequiredString(message.content, 'Message content'));
    if (message.content) {
      errors.push(...FieldValidators.validateStringLength(message.content, 'Message content', undefined, 5000));
    }

    // Validate direction
    const validDirections = ['inbound', 'outbound'];
    if (message.direction && !validDirections.includes(message.direction)) {
      errors.push('Invalid message direction');
    }

    // Validate lead_id
    errors.push(...FieldValidators.validateRequiredString(message.lead_id, 'Lead ID'));

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Bulk validation utility
 */
export class BulkValidator {
  /**
   * Validate array of entities using specified validator
   */
  static validateBulk<T>(
    entities: T[],
    validator: (entity: T) => ValidationResult
  ): { valid: T[]; invalid: Array<{ entity: T; errors: string[] }> } {
    const valid: T[] = [];
    const invalid: Array<{ entity: T; errors: string[] }> = [];

    entities.forEach(entity => {
      const result = validator(entity);
      if (result.isValid) {
        valid.push(entity);
      } else {
        invalid.push({ entity, errors: result.errors });
      }
    });

    return { valid, invalid };
  }
} 