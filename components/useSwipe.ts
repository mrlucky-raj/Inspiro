import { useState, TouchEvent } from 'react';

interface SwipeInput {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
}

// Minimum distance (in pixels) for a swipe to be registered
const MIN_SWIPE_DISTANCE = 50;
// Maximum time (in milliseconds) for a swipe
const MAX_SWIPE_TIME = 500;

export const useSwipe = ({
  onSwipedLeft,
  onSwipedRight,
  onSwipedUp,
  onSwipedDown,
}: SwipeInput) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    // Only track single-finger touches
    if (e.touches.length !== 1) {
      setTouchStart(null);
      return;
    }
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart || e.changedTouches.length !== 1) {
      return;
    }

    const touch = e.changedTouches[0];
    const touchEnd = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const dt = touchEnd.time - touchStart.time;

    // Reset touch start state
    setTouchStart(null);

    // Ensure swipe happened within the time limit
    if (dt > MAX_SWIPE_TIME) {
        return;
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > MIN_SWIPE_DISTANCE) {
      // It's a swipe, determine direction
      if (absDx > absDy) { // Horizontal swipe
        if (dx > 0) {
          onSwipedRight?.();
        } else {
          onSwipedLeft?.();
        }
      } else { // Vertical swipe
        if (dy > 0) {
          onSwipedDown?.();
        } else {
          onSwipedUp?.();
        }
      }
    }
  };

  const onTouchCancel = () => {
    setTouchStart(null);
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
};
