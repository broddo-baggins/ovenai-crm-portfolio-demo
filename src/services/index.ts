// Service exports for better import organization
export { default as apiService } from './apiService';
export { BaseService } from './baseService';
export { default as clientService } from './clientService';
export { dashboardPersistence } from './dashboardPersistence';
export { reportsApi } from './reportsApi';
export { websocketService } from './websocketService';

// Base services
export { default as logger } from './base/logger';
export { ServiceErrorHandler } from './base/errorHandler';
export { EntityValidators } from './base/validators';
export { QueryBuilder } from './base/queryBuilder';
export { TrendCalculator } from './base/trendCalculator';

// Types
export type { DashboardLayout, SaveResult } from './dashboardPersistence';
export type { WebSocketEventType, WebSocketEvent, WebSocketOptions } from './websocketService'; 