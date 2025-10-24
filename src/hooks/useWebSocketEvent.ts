
import { useEffect } from 'react';
import { websocketService, WebSocketEventType } from '../services/websocketService';

/**
 * Hook for subscribing to WebSocket events
 * 
 * Manages the lifecycle of WebSocket event subscriptions
 * 
 * @param eventType Type of event to subscribe to
 * @param callback Function to call when event is received
 */
function useWebSocketEvent<T>(eventType: WebSocketEventType, callback: (data: T) => void) {
  useEffect(() => {
    console.log(`Subscribing to ${eventType} WebSocket events`);
    
    // Connect if not already connected
    if (!websocketService.isConnected()) {
      console.log('Connecting to WebSocket server for real-time updates');
      websocketService.connect();
    }
    
    // Subscribe to specific event
    const unsubscribe = websocketService.on<T>(eventType, callback);
    
    // Clean up on unmount
    return () => {
      console.log(`Unsubscribing from ${eventType} WebSocket events`);
      unsubscribe();
    };
  }, [eventType, callback]);
}

export default useWebSocketEvent;
