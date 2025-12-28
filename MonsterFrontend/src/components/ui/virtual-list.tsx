import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useOptimizedState } from '@/hooks/useOptimizedLoading';
import './virtual-list.css';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: number | string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  'aria-label'?: string;
}

/**
 * Virtual scrolling component for large lists
 * Note: This is a simplified implementation. For production use, 
 * consider installing and using 'react-window' or '@tanstack/react-virtual'
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  className = '',
  overscan = 5,
  'aria-label': ariaLabel = 'Virtual list'
}: VirtualListProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Input validation
  if (itemHeight <= 0) {
    console.warn('VirtualList: itemHeight must be greater than 0');
    return (
      <div className={`flex items-center justify-center h-32 text-red-500 ${className}`}>
        Invalid item height configuration
      </div>
    );
  }

  if (height <= 0) {
    console.warn('VirtualList: height must be greater than 0');
    return (
      <div className={`flex items-center justify-center h-32 text-red-500 ${className}`}>
        Invalid height configuration
      </div>
    );
  }

  const [visibleRange, setVisibleRange] = useOptimizedState({
    start: 0,
    end: Math.min(items.length - 1, Math.ceil(height / itemHeight))
  });

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + height) / itemHeight)
    );
    
    setVisibleRange({
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    });
  }, [items.length, height, itemHeight, overscan, setVisibleRange]);

  // Set CSS custom properties for scroll container
  useEffect(() => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current;
      element.style.setProperty('--list-height', typeof height === 'number' ? `${height}px` : height);
      element.style.setProperty('--list-width', typeof width === 'number' ? `${width}px` : width);
    }
  }, [height, width]);

  // Set CSS custom properties for container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--total-height', `${totalHeight}px`);
    }
  }, [totalHeight]);

  // Set CSS custom properties for items
  useEffect(() => {
    visibleItems.forEach((_, index) => {
      const actualIndex = visibleRange.start + index;
      const itemElement = itemRefs.current[index];
      if (itemElement) {
        itemElement.style.setProperty('--item-top', `${actualIndex * itemHeight}px`);
        itemElement.style.setProperty('--item-height', `${itemHeight}px`);
      }
    });
  }, [visibleRange, itemHeight, visibleItems.length]);

  if (!items.length) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 ${className}`} role="status" aria-live="polite">
        No items to display
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="virtual-list-scroll-container"
        aria-label={ariaLabel}
        aria-describedby="virtual-list-info"
      >
        <div 
          ref={containerRef}
          className="virtual-list-container"
          role="presentation"
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={`virtual-item-${actualIndex}`}
                ref={el => { itemRefs.current[index] = el; }}
                className="virtual-list-item"
                aria-label={`Item ${actualIndex + 1}`}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Performance info in development */}
      {import.meta.env.DEV && (
        <div 
          id="virtual-list-info"
          className="virtual-list-performance-info"
          role="status"
          aria-live="polite"
        >
          Showing items {visibleRange.start} - {visibleRange.end} of {items.length}
        </div>
      )}
    </div>
  );
}

export default VirtualList;