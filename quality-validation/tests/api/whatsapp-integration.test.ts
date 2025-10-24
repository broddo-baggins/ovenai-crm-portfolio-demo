import { describe, it, expect, vi } from 'vitest';
import { WhatsAppService } from '../../src/services/whatsapp-api';
import WhatsAppLoggingService from '../../src/services/whatsapp-logging';
import WhatsAppMonitoringService from '../../src/services/whatsapp-monitoring';

// Mock environment variables
vi.mock('../../src/config/env', () => ({
  env: {
    VITE_WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
    VITE_WHATSAPP_ACCESS_TOKEN: 'test-token',
    VITE_WHATSAPP_BUSINESS_ID: 'test-business-id',
    VITE_SUPABASE_URL: 'https://test.supabase.co'
  }
}));

describe('WhatsApp API Integration', () => {
  it('should have WhatsApp service properly configured', () => {
    const service = new WhatsAppService();
    expect(service).toBeDefined();
    expect(service.getConnectionStatus).toBeDefined();
    expect(service.sendMessage).toBeDefined();
    expect(service.sendTemplateMessage).toBeDefined();
  });

  it('should have WhatsApp logging service available', () => {
    expect(WhatsAppLoggingService).toBeDefined();
    expect(WhatsAppLoggingService.logOutboundMessage).toBeDefined();
    expect(WhatsAppLoggingService.logInboundMessage).toBeDefined();
    expect(WhatsAppLoggingService.logTemplateUsage).toBeDefined();
    expect(WhatsAppLoggingService.logWebhookProcessing).toBeDefined();
  });

  it('should have WhatsApp monitoring service available', () => {
    const monitoring = WhatsAppMonitoringService.getInstance();
    expect(monitoring).toBeDefined();
    expect(monitoring.startMonitoring).toBeDefined();
    expect(monitoring.stopMonitoring).toBeDefined();
    expect(monitoring.getDashboardData).toBeDefined();
    expect(monitoring.getComplianceReport).toBeDefined();
  });

  it('should have proper environment configuration for WhatsApp', () => {
    // Basic configuration check
    expect(process.env.VITE_WHATSAPP_PHONE_NUMBER_ID).toBeDefined();
    expect(process.env.VITE_WHATSAPP_ACCESS_TOKEN).toBeDefined();
    expect(process.env.VITE_WHATSAPP_BUSINESS_ID).toBeDefined();
  });

  it('should validate connection status structure without API calls', async () => {
    const service = new WhatsAppService();
    
    // Mock the fetch to avoid actual API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [{ 
          id: 'test-phone-id',
          display_phone_number: '+1234567890',
          verified_name: 'Test Business'
        }]
      })
    });

    const status = await service.getConnectionStatus();
    
    expect(status).toHaveProperty('connected');
    expect(status).toHaveProperty('phoneNumber');
    expect(status).toHaveProperty('lastActivity');
    expect(status).toHaveProperty('apiCallsToday');
    expect(typeof status.connected).toBe('boolean');
  });

  it('should validate service methods exist and are callable', () => {
    const service = new WhatsAppService();
    
    // Test that methods exist and can be called
    expect(typeof service.getConnectionStatus).toBe('function');
    expect(typeof service.sendMessage).toBe('function');
    expect(typeof service.sendTemplateMessage).toBe('function');
  });

  it('should validate logging service methods exist', () => {
    // Test that logging methods exist
    expect(typeof WhatsAppLoggingService.logOutboundMessage).toBe('function');
    expect(typeof WhatsAppLoggingService.logInboundMessage).toBe('function');
    expect(typeof WhatsAppLoggingService.logTemplateUsage).toBe('function');
    expect(typeof WhatsAppLoggingService.logWebhookProcessing).toBe('function');
    expect(typeof WhatsAppLoggingService.logRateLimiting).toBe('function');
    expect(typeof WhatsAppLoggingService.updateMessageDeliveryStatus).toBe('function');
    expect(typeof WhatsAppLoggingService.getComplianceLogs).toBe('function');
  });

  it('should validate monitoring service methods exist', () => {
    const monitoring = WhatsAppMonitoringService.getInstance();
    
    // Test that monitoring methods exist
    expect(typeof monitoring.startMonitoring).toBe('function');
    expect(typeof monitoring.stopMonitoring).toBe('function');
    expect(typeof monitoring.getDashboardData).toBe('function');
    expect(typeof monitoring.getComplianceReport).toBe('function');
  });

  it('should validate services are properly instantiated', () => {
    // Test that services can be instantiated without errors
    expect(() => new WhatsAppService()).not.toThrow();
    expect(() => WhatsAppMonitoringService.getInstance()).not.toThrow();
    
    // Test singleton pattern
    const monitoring1 = WhatsAppMonitoringService.getInstance();
    const monitoring2 = WhatsAppMonitoringService.getInstance();
    expect(monitoring1).toBe(monitoring2);
  });

  it('should validate Meta compliance structure requirements', () => {
    // Test that services have the expected structure for Meta compliance
    expect(WhatsAppLoggingService).toBeDefined();
    expect(WhatsAppMonitoringService).toBeDefined();
    
    // Test that the singleton monitoring service exists
    const monitoring = WhatsAppMonitoringService.getInstance();
    expect(monitoring).toBeDefined();
    
    // Test that logging service has static methods
    expect(WhatsAppLoggingService.logOutboundMessage).toBeDefined();
    expect(WhatsAppLoggingService.logInboundMessage).toBeDefined();
    expect(WhatsAppLoggingService.logTemplateUsage).toBeDefined();
    expect(WhatsAppLoggingService.logWebhookProcessing).toBeDefined();
  });
}); 