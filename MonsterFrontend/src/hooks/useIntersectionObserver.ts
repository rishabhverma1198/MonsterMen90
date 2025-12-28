import { useEffect, useRef } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  callback?: (entries: IntersectionObserverEntry[]) => void;
  enabled?: boolean;
}

/**
 * Hook for intersection observer to detect when elements come into view
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { 
    threshold = 0.1, 
    root = null, 
    rootMargin = '0px',
    enabled = true 
  } = options;
  
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(callback, {
      threshold,
      root,
      rootMargin
    });

    const currentTarget = targetRef.current;
    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, threshold, root, rootMargin, enabled]);

  return targetRef;
}