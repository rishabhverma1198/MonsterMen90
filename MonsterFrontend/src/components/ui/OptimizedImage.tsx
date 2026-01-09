import { useState, useEffect, useRef } from 'react';
import { getProductImage, generatePlaceholderImage } from '@/lib/utils/image.utils';

interface OptimizedImageProps {
  src: string | string[] | null | undefined;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., "16/9", "1/1", "4/3"
  width?: number;
  height?: number;
  priority?: boolean; // Load immediately (above the fold)
  fallback?: string;
}

/**
 * Optimized Image Component
 * - Prevents layout shifts with aspect ratio
 * - Handles lazy loading properly
 * - Provides fallback for missing images
 * - Respects browser lazy loading intervention
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  aspectRatio,
  width,
  height,
  priority = false,
  fallback,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    const initialSrc = getProductImage(src as string[], 0);
    return initialSrc || fallback || generatePlaceholderImage(width || 400, height || 400, 'No Image');
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || priority) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const newSrc = getProductImage(src as string[], 0);
            if (newSrc && newSrc !== imageSrc) {
              setImageSrc(newSrc);
            } else if (!newSrc && fallback && fallback !== imageSrc) {
              setImageSrc(fallback);
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src, fallback, imageSrc, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    if (fallback) {
      setImageSrc(fallback);
    } else {
      setImageSrc(generatePlaceholderImage(width || 400, height || 400, 'Image Not Available'));
    }
  };

  const containerStyle: React.CSSProperties = {};
  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  } else if (width && height) {
    containerStyle.aspectRatio = `${width} / ${height}`;
  } else {
    containerStyle.aspectRatio = '1 / 1'; // Default square
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={containerStyle}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          // Prevent layout shift
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={containerStyle}
        >
          <div className="animate-pulse bg-gray-200 w-full h-full" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"
          style={containerStyle}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

