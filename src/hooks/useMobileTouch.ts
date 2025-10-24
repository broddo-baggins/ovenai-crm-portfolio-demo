import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

export interface MobileTouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTap: (callback: () => void) => void;
  onDoubleTap: (callback: () => void) => void;
  onSwipe: (callback: (direction: SwipeDirection) => void) => void;
  onPinch: (callback: (scale: number) => void) => void;
  isTouch: boolean;
  touchPosition: TouchPosition | null;
  swipeDirection: SwipeDirection | null;
}

export const useMobileTouch = (): MobileTouchHandlers => {
  const [isTouch, setIsTouch] = useState(false);
  const [touchPosition, setTouchPosition] = useState<TouchPosition | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  
  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchTimeRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const tapCallbackRef = useRef<(() => void) | null>(null);
  const doubleTapCallbackRef = useRef<(() => void) | null>(null);
  const swipeCallbackRef = useRef<((direction: SwipeDirection) => void) | null>(null);
  const pinchCallbackRef = useRef<((scale: number) => void) | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);

  useEffect(() => {
    const checkTouchSupport = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchSupport();
    window.addEventListener('resize', checkTouchSupport);
    
    return () => window.removeEventListener('resize', checkTouchSupport);
  }, []);

  const getTouchPosition = (e: React.TouchEvent): TouchPosition => {
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const getPinchDistance = (e: React.TouchEvent): number => {
    if (e.touches.length < 2) return 0;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const position = getTouchPosition(e);
    setTouchPosition(position);
    touchStartRef.current = position;
    touchTimeRef.current = Date.now();

    if (e.touches.length === 2) {
      initialPinchDistanceRef.current = getPinchDistance(e);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const position = getTouchPosition(e);
    setTouchPosition(position);

    // Handle pinch gesture
    if (e.touches.length === 2 && pinchCallbackRef.current) {
      const currentDistance = getPinchDistance(e);
      const scale = currentDistance / initialPinchDistanceRef.current;
      pinchCallbackRef.current(scale);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const endPosition = getTouchPosition(e);
    const touchDuration = Date.now() - touchTimeRef.current;
    const deltaX = endPosition.x - touchStartRef.current.x;
    const deltaY = endPosition.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine if it's a tap (short duration, small movement)
    if (touchDuration < 300 && distance < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap < 300 && doubleTapCallbackRef.current) {
        // Double tap
        doubleTapCallbackRef.current();
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        // Single tap
        lastTapRef.current = now;
        setTimeout(() => {
          if (lastTapRef.current === now && tapCallbackRef.current) {
            tapCallbackRef.current();
          }
        }, 250);
      }
    }
    // Determine swipe direction
    else if (distance > 50 && swipeCallbackRef.current) {
      let direction: 'left' | 'right' | 'up' | 'down';
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const swipeInfo: SwipeDirection = { direction, distance };
      setSwipeDirection(swipeInfo);
      swipeCallbackRef.current(swipeInfo);
      
      // Reset swipe direction after a delay
      setTimeout(() => setSwipeDirection(null), 500);
    }

    // Reset touch state
    setTouchPosition(null);
    touchStartRef.current = null;
  }, []);

  const onTap = useCallback((callback: () => void) => {
    tapCallbackRef.current = callback;
  }, []);

  const onDoubleTap = useCallback((callback: () => void) => {
    doubleTapCallbackRef.current = callback;
  }, []);

  const onSwipe = useCallback((callback: (direction: SwipeDirection) => void) => {
    swipeCallbackRef.current = callback;
  }, []);

  const onPinch = useCallback((callback: (scale: number) => void) => {
    pinchCallbackRef.current = callback;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTap,
    onDoubleTap,
    onSwipe,
    onPinch,
    isTouch,
    touchPosition,
    swipeDirection
  };
};

export default useMobileTouch; 