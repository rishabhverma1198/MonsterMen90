import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/useOptimizedLoading';

interface PerformanceMonitorProps {
  componentName?: string;
  showDetails?: boolean;
}

/**
 * Performance monitoring component
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName = 'Unknown',
  showDetails = false
}) => {
  const { metrics } = usePerformanceMonitor(componentName);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || !import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50 max-w-xs">
      <div className="font-semibold mb-1">Performance Monitor</div>
      <div>Component: {componentName}</div>
      <div>Mount time: {metrics.mountTime.toFixed(2)}ms</div>
      <div>Render count: {metrics.renderCount}</div>
      {showDetails && (
        <>
          <div>Last render: {metrics.lastRender.toFixed(2)}ms</div>
          <div className="mt-1 text-yellow-300">
            {metrics.lastRender > 16 && '⚠️ Slow render detected!'}
          </div>
        </>
      )}
    </div>
  );
};

// Global performance monitoring
export const useGlobalPerformanceMonitor = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            console.log(`[Performance] LCP: ${entry.startTime.toFixed(2)}ms`);
            break;
          case 'first-input':
            console.log(`[Performance] FID: ${(entry as any).processingStart - entry.startTime}ms`);
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              console.log(`[Performance] CLS: ${(entry as any).value}`);
            }
            break;
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        if (usedMB > 50) {
          console.log(`[Performance] Memory: ${usedMB}MB / ${totalMB}MB`);
        }
      }
    }, 30000);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, []);
};

export default PerformanceMonitor;