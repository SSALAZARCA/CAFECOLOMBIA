import React, { useRef, useEffect, useState } from 'react';

interface TouchOptimizedProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  className?: string;
  enablePullToRefresh?: boolean;
  swipeThreshold?: number;
}

export function TouchOptimized({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  className = '',
  enablePullToRefresh = false,
  swipeThreshold = 50
}: TouchOptimizedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const minSwipeDistance = swipeThreshold;
  const maxPullDistance = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };

    // Pull to refresh logic
    if (enablePullToRefresh && onPullToRefresh) {
      const container = containerRef.current;
      if (container && container.scrollTop === 0) {
        const deltaY = currentTouch.y - touchStart.y;
        if (deltaY > 0) {
          e.preventDefault();
          setIsPulling(true);
          setPullDistance(Math.min(deltaY, maxPullDistance));
        }
      }
    }

    setTouchEnd(currentTouch);
  };

  const onTouchEnd = async () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Handle pull to refresh
    if (isPulling && pullDistance > 60 && onPullToRefresh) {
      setIsRefreshing(true);
      try {
        await onPullToRefresh();
      } catch (error) {
        console.error('Error during pull to refresh:', error);
      } finally {
        setIsRefreshing(false);
        setIsPulling(false);
        setPullDistance(0);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }

    // Handle swipe gestures
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    } else if (isUpSwipe && onSwipeUp) {
      onSwipeUp();
    } else if (isDownSwipe && onSwipeDown) {
      onSwipeDown();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add haptic feedback for supported devices
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  useEffect(() => {
    // Trigger haptic feedback when pulling
    if (isPulling && pullDistance > 60) {
      triggerHapticFeedback('light');
    }
  }, [isPulling, pullDistance]);

  return (
    <div
      ref={containerRef}
      className={`touch-optimized ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: isPulling ? `translateY(${pullDistance * 0.5}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Pull to refresh indicator */}
      {enablePullToRefresh && (isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white shadow-sm z-10"
          style={{
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            transform: `translateY(-${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-gray-600">
            {isRefreshing ? (
              <>
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Actualizando...</span>
              </>
            ) : pullDistance > 60 ? (
              <span className="text-sm">Suelta para actualizar</span>
            ) : (
              <span className="text-sm">Desliza hacia abajo</span>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

// Hook para detectar dispositivos táctiles
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);

    return () => {
      window.removeEventListener('resize', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
}

// Hook para detectar orientación del dispositivo
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

// Componente para botones optimizados para touch
interface TouchButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy';
}

export function TouchButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  hapticFeedback = 'light'
}: TouchButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[hapticFeedback]);
    }
    
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        touch-button
        min-h-[44px] min-w-[44px]
        active:scale-95 
        transition-transform duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </button>
  );
}