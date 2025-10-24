import { DataPayload } from '@/types/utility-types';
import { toast } from "sonner";
import logger from './base/logger';

/**
 * WebSocket event types for real-time notifications
 */
export type WebSocketEventType = 
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'MESSAGE_RECEIVED'
  | 'MEETING_SCHEDULED'
  | 'TEMPERATURE_CHANGE';

/**
 * WebSocket event interface
 */
export interface WebSocketEvent<T = DataPayload> {
  type: WebSocketEventType;
  payload: T;
}

/**
 * Options for WebSocket service
 */
export interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (event: WebSocketEvent) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

/**
 * WebSocket Service Class
 * 
 * Manages WebSocket connections to AWS API Gateway for real-time updates
 * Handles reconnection logic and event management
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private options: WebSocketOptions;
  private reconnectAttempts: number = 0;
  private eventListeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private isAwsConnection: boolean = false;
  
  /**
   * Creates a new WebSocket service instance
   * @param url WebSocket endpoint URL (AWS API Gateway in production)
   * @param options Configuration options
   */
  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      ...options
    };
    
    logger.info('WebSocket service created for real-time connections to AWS', 'WebSocketService');
  }
  
  /**
   * Set AWS-specific connection parameters
   * @param isAws Whether this is an AWS connection
   * @param apiKey Optional API key for AWS API Gateway
   */
  setAwsConnection(isAws: boolean, apiKey?: string) {
    this.isAwsConnection = isAws;
    if (apiKey) {
      this.url = this.url + (this.url.includes('?') ? '&' : '?') + `apiKey=${apiKey}`;
    }
    logger.info(`WebSocket configured for ${isAws ? 'AWS API Gateway' : 'standard'} connection`, 'WebSocketService');
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      logger.info('Connecting to WebSocket server', 'WebSocketService', { url: this.url });
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        logger.info('WebSocket connected', 'WebSocketService');
        this.reconnectAttempts = 0;
        
        // For AWS API Gateway, send authentication message
        if (this.isAwsConnection) {
          this.socket?.send(JSON.stringify({ action: 'authenticate' }));
        }
        
        if (this.options.onOpen) {
          this.options.onOpen();
        }
      };
      
      this.socket.onclose = (event) => {
        logger.info('WebSocket disconnected', 'WebSocketService', { code: event.code, reason: event.reason });
        if (this.options.onClose) {
          this.options.onClose();
        }
        
        // Attempt to reconnect
        if (this.reconnectAttempts < (this.options.reconnectAttempts || 5)) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.options.reconnectInterval);
        } else {
          toast.error('Failed to connect to real-time updates. Please refresh the page.');
        }
      };
      
      this.socket.onerror = (error) => {
        logger.error('WebSocket error', 'WebSocketService', error);
        if (this.options.onError) {
          this.options.onError(error);
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          
          if (this.options.onMessage) {
            this.options.onMessage(data);
          }
          
          // Dispatch to specific listeners
          this.dispatch(data.type, data.payload);
          
          // Show toast notifications based on event type
          this.handleNotification(data);
        } catch (error) {
          logger.error('Error parsing WebSocket message', 'WebSocketService', error);
        }
      };
    } catch (error) {
      logger.error('Error connecting to WebSocket', 'WebSocketService', error);
    }
  }
  
  /**
   * Register an event listener for a specific event type
   * @param eventType Event type to listen for
   * @param callback Function to call when event is received
   * @returns Unsubscribe function
   */
  on<T>(eventType: WebSocketEventType, callback: (data: T) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }
  
  /**
   * Dispatch an event to registered listeners
   * @param eventType Event type
   * @param data Event data
   */
  private dispatch(eventType: WebSocketEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  /**
   * Handle notifications for different event types
   * @param event WebSocket event
   */
  private handleNotification(event: WebSocketEvent): void {
    switch (event.type) {
      case 'LEAD_CREATED':
        toast.success(`New lead: ${event.payload.name || 'Unknown'}`);
        break;
      case 'MESSAGE_RECEIVED':
        toast.info(`New message from ${event.payload.sender || 'Unknown'}`);
        break;
      case 'MEETING_SCHEDULED':
        toast.success(`Meeting scheduled with ${event.payload.leadName || 'Unknown'}`);
        break;
      case 'TEMPERATURE_CHANGE':
        if (event.payload.direction === 'up') {
          toast.success(`Lead temperature increased: ${event.payload.leadName || 'Unknown'}`);
        } else {
          toast.error(`Lead temperature decreased: ${event.payload.leadName || 'Unknown'}`);
        }
        break;
      default:
        break;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  /**
   * Clean up all event listeners and disconnect
   * Call this when the service is no longer needed to prevent memory leaks
   */
  cleanup(): void {
    // Clear all event listeners
    this.eventListeners.clear();
    
    // Disconnect from WebSocket
    this.disconnect();
    
    // Reset reconnection attempts
    this.reconnectAttempts = 0;
    
    logger.info('WebSocket service cleaned up', 'WebSocketService');
  }
  
  /**
   * Check if connected to the WebSocket server
   * @returns Whether connected to the server
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
// In production, this would connect to AWS API Gateway WebSocket endpoint
const websocketService = new WebSocketService(
  process.env.NODE_ENV === 'production' 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
            : 'ws://localhost:3000/ws'
);

// Add error handling for connection failures
websocketService.setAwsConnection(process.env.NODE_ENV === 'production');

// Don't automatically connect - let components request connection
// This prevents unnecessary connection attempts on pages that don't need it
// websocketService.connect();

export { websocketService };
export default WebSocketService;
