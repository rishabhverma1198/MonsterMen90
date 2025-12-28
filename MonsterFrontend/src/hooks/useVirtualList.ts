import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { WebsiteProduct } from '@/lib/services/website-product.service';

export interface VirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualListItem {
  item: WebsiteProduct;
  index: number;
}

export interface VirtualListReturn {
  visibleItems: VirtualListItem[];
  totalHeight: number;
  offsetY: number;
  itemHeight: number;
}

/**
 * Hook for virtual scrolling lists to improve performance with large datasets
 */
export function useVirtualList(
  items: WebsiteProduct[],
  options: VirtualListOptions
): VirtualListReturn {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index
      }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const scrollHandler = (e: Event) => {
        handleScroll(e as unknown as React.UIEvent<HTMLDivElement>);
      };
      container.addEventListener('scroll', scrollHandler, { passive: true });
      return () => container.removeEventListener('scroll', scrollHandler);
    }
  }, [handleScroll]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    itemHeight
  };
}