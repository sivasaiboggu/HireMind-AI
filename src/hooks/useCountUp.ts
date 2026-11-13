import { useState, useEffect } from 'react';

/**
 * The stylesheet already drops CSS motion under prefers-reduced-motion; the
 * score gauges count up in JavaScript, which that media query cannot reach.
 * Injectable matcher keeps the decision testable outside a browser.
 */
export function prefersReducedMotion(
  matchMediaFn?: (query: string) => { matches: boolean }
): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  if (typeof matchMediaFn === 'function') return matchMediaFn(query).matches;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia(query).matches;
  }
  return false;
}

export function useCountUp(end: number, duration: number = 1200): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Reduced motion: show the final score immediately instead of animating.
    if (prefersReducedMotion()) {
      setCount(end);
      return;
    }
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      
      setCount(Math.floor(easedProgress * end));
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return count;
}
