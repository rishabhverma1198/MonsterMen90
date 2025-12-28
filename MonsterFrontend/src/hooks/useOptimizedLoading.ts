import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced hook for lazy loading components with intersection observer
 */
export function useLazyLoad<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const elementRef = useRef<T>(null);

  const intersectionCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !hasStartedLoading) {
      setHasStartedLoading(true);
      setIsInView(true);
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [hasStartedLoading]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(intersectionCallback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [intersectionCallback, options]);

  return {
    elementRef,
    isInView,
    isLoaded,
    hasStartedLoading,
    shouldLoad: isInView && !isLoaded
  };
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useImageLazyLoad(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const imageLoader = new Image();
          
          imageLoader.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            setIsError(false);
          };
          
          imageLoader.onerror = () => {
            setIsError(true);
            setIsLoaded(false);
          };
          
          imageLoader.src = src;
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState({
    mountTime: 0,
    renderCount: 0,
    lastRender: 0
  });
  const lastLogTimeRef = useRef(0);
  const LOG_THROTTLE_MS = 5000; // Only log slow renders every 5 seconds

  useEffect(() => {
    const startTime = performance.now();
    
    const measureMount = () => {
      const mountTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, mountTime }));
      
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
      }
    };

    requestAnimationFrame(measureMount);

    return () => {
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${componentName} unmounted`);
      }
    };
  }, [componentName]);

  const measureRender = useCallback(() => {
    const renderStart = performance.now();
    
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRender: renderTime
      }));
      
      // Throttle slow render warnings to prevent console spam
      const now = Date.now();
      if (import.meta.env.DEV && renderTime > 16 && (now - lastLogTimeRef.current) > LOG_THROTTLE_MS) {
        lastLogTimeRef.current = now;
        console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    });
  }, [componentName]);

  return { metrics, measureRender };
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for memory-efficient state updates
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    const value = typeof newValue === 'function' ? (newValue as (prev: T) => T)(stateRef.current) : newValue;
    
    if (value !== stateRef.current) {
      stateRef.current = value;
      setState(value);
    }
  }, []);

  return [state, optimizedSetState] as const;
}