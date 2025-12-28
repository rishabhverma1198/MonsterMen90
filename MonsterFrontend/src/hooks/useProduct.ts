import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { WebsiteProductService } from '@/lib/services/website-product.service';
import { WHOLESALE_CONFIG } from '@/lib/wholesale-constants';
import type { UseProductDataReturn } from '@/types/wholesale-types';
import type { WebsiteProduct } from '@/lib/services/website-product.service';

// ===========================================
// IMPROVEMENT 1: CONFIGURATION AND CONSTANTS
// ===========================================
/**
 * Centralized configuration for better maintainability
 * All magic numbers and constants are defined here
 */
const REQUEST_CONFIG = {
  TIMEOUT_MS: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes cache
} as const;

// ===========================================
// IMPROVEMENT 2: CUSTOM ERROR TYPES
// ===========================================
/**
 * Custom error classes for better error handling and debugging
 * Provides structured error information instead of generic strings
 */
class ProductFetchError extends Error {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELLED' | 'UNKNOWN';
  originalError?: Error;
  timestamp: number;

  constructor(
    message: string,
    code: 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELLED' | 'UNKNOWN',
    originalError?: Error
  ) {
    super(message);
    this.name = 'ProductFetchError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = Date.now();
  }
}

// ===========================================
// IMPROVEMENT 3: TYPE DEFINITIONS
// ===========================================
/**
 * Enhanced interfaces for better type safety and documentation
 */
interface ProductCache {
  data: WebsiteProduct[];
  timestamp: number;
  totalCount: number;
  hash: string; // For cache invalidation
}

type LoadingState = 'idle' | 'loading' | 'refreshing' | 'error' | 'success';

interface PerformanceMetrics {
  fetchStartTime: number;
  fetchEndTime: number;
  cacheHit: boolean;
  totalRetries: number;
  dataSize: number;
}

/**
 * Enhanced hook with comprehensive improvements:
 * 1. Performance optimization through caching and request deduplication
 * 2. Better error handling with custom error types
 * 3. Enhanced loading states for better UX
 * 4. Performance monitoring and metrics
 * 5. Request cancellation to prevent memory leaks
 */
export function useProductData(): UseProductDataReturn {
  // ===========================================
  // IMPROVEMENT 4: ENHANCED STATE MANAGEMENT
  // ===========================================
  // Core state with better typing
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Additional state for enhanced functionality
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // ===========================================
  // IMPROVEMENT 5: REF-BASED OPTIMIZATIONS
  // ===========================================
  // Using refs to avoid stale closures and enable cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const cacheRef = useRef<ProductCache | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastFetchTimeRef = useRef<number>(0);

  // ===========================================
  // IMPROVEMENT 6: MEMOIZED CONFIGURATION
  // ===========================================
  const config = useMemo(() => ({
    timeoutMs: REQUEST_CONFIG.TIMEOUT_MS,
    maxRetries: REQUEST_CONFIG.MAX_RETRIES,
    retryDelay: REQUEST_CONFIG.RETRY_DELAY_MS,
    cacheTtl: REQUEST_CONFIG.CACHE_TTL_MS,
  }), []);

  // ===========================================
  // IMPROVEMENT 7: UTILITY FUNCTIONS
  // ===========================================
  const createTimeoutPromise = useCallback((ms: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ProductFetchError('Request timeout', 'TIMEOUT'));
      }, ms);
    });
  }, []);

  const isCacheValid = useCallback((cache: ProductCache): boolean => {
    return Date.now() - cache.timestamp < config.cacheTtl;
  }, [config.cacheTtl]);

  const generateCacheHash = useCallback((data: WebsiteProduct[]): string => {
    return data.map(p => p.id).sort().join('|');
  }, []);

  const getCachedData = useCallback((): ProductCache | null => {
    const cache = cacheRef.current;
    return cache && isCacheValid(cache) ? cache : null;
  }, [isCacheValid]);

  const setCachedData = useCallback((data: WebsiteProduct[], count: number) => {
    cacheRef.current = {
      data: [...data], // Immutable copy to prevent mutations
      timestamp: Date.now(),
      totalCount: count,
      hash: generateCacheHash(data),
    };
  }, [generateCacheHash]);

  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  // ===========================================
  // IMPROVEMENT 8: OPTIMIZED DEDUPLICATION
  // ===========================================
  /**
   * More efficient deduplication using Set instead of array.findIndex
   * Time complexity: O(n) vs O(n²) of the original implementation
   */
  const deduplicateProducts = useCallback((products: WebsiteProduct[]): WebsiteProduct[] => {
    const seenIds = new Set<string>();
    const uniqueProducts: WebsiteProduct[] = [];

    for (const product of products) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        uniqueProducts.push(product);
      }
    }

    return uniqueProducts;
  }, []);

  // ===========================================
  // IMPROVEMENT 9: ENHANCED RETRY LOGIC
  // ===========================================
  /**
   * Robust retry logic with exponential backoff and proper error handling
   */
  const fetchProductsByGender = useCallback(async (
    gender: 'men' | 'women',
    signal?: AbortSignal
  ): Promise<WebsiteProduct[]> => {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        if (signal?.aborted) {
          throw new ProductFetchError('Request was cancelled', 'CANCELLED');
        }

        const timeoutPromise = createTimeoutPromise(config.timeoutMs);
        const requestPromise = WebsiteProductService.getProductsByGender(
          gender,
          WHOLESALE_CONFIG.DEFAULT_PAGE_SIZE
        );

        const result = await Promise.race([requestPromise, timeoutPromise]);
        return result;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        retryCountRef.current = attempt;

        if (signal?.aborted ||
            lastError.message.includes('cancelled') ||
            lastError instanceof DOMException) {
          throw new ProductFetchError('Request was cancelled', 'CANCELLED', lastError);
        }

        if (attempt < config.maxRetries) {
          // Exponential backoff for better UX
          const delay = config.retryDelay * Math.pow(1.5, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new ProductFetchError(
      `Failed to fetch ${gender} products after ${config.maxRetries} attempts: ${lastError.message}`,
      'NETWORK_ERROR',
      lastError
    );
  }, [config.maxRetries, config.timeoutMs, config.retryDelay, createTimeoutPromise]);

  // ===========================================
  // IMPROVEMENT 10: COMPREHENSIVE FETCH FUNCTION
  // ===========================================
  /**
   * Main fetch function with extensive error handling, caching, and performance monitoring
   */
  const fetchAllProducts = useCallback(async (isRefetch = false) => {
    const currentRequestId = ++requestIdRef.current;
    const fetchStartTime = Date.now();

    try {
      // Granular loading states for better UX
      setLoadingState(isRefetch ? 'refreshing' : 'loading');
      setError(null);

      const metrics: PerformanceMetrics = {
        fetchStartTime,
        fetchEndTime: 0,
        cacheHit: false,
        totalRetries: 0,
        dataSize: 0
      };

      // ===========================================
      // IMPROVEMENT 11: SMART CACHING STRATEGY
      // ===========================================
      if (!isRefetch) {
        const cachedData = getCachedData();
        if (cachedData) {
          setProducts(cachedData.data);
          setTotalCount(cachedData.totalCount);
          setLoadingState('success');
          metrics.cacheHit = true;
          metrics.fetchEndTime = Date.now();
          metrics.dataSize = cachedData.data.length;
          setPerformanceMetrics(metrics);

          if (import.meta.env.DEV) {
            console.log('[useProductData] Loaded products from cache', {
              productCount: cachedData.data.length,
              cacheAge: Date.now() - cachedData.timestamp,
              timestamp: new Date().toISOString()
            });
          }
          return;
        }
      }

      // ===========================================
      // IMPROVEMENT 12: REQUEST CANCELLATION
      // ===========================================
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (abortController.signal.aborted) {
        throw new ProductFetchError('Request was cancelled', 'CANCELLED');
      }

      // ===========================================
      // IMPROVEMENT 13: PARTIAL FAILURE HANDLING
      // ===========================================
      const [menProducts, womenProducts] = await Promise.allSettled([
        fetchProductsByGender('men', abortController.signal),
        fetchProductsByGender('women', abortController.signal)
      ]);

      if (abortController.signal.aborted) {
        throw new ProductFetchError('Request was cancelled', 'CANCELLED');
      }

      // Handle partial failures gracefully
      const successfulResults = [];
      const errors = [];

      if (menProducts.status === 'fulfilled') {
        successfulResults.push(menProducts.value);
      } else {
        errors.push(`Men products: ${menProducts.reason?.message || 'Unknown error'}`);
      }

      if (womenProducts.status === 'fulfilled') {
        successfulResults.push(womenProducts.value);
      } else {
        errors.push(`Women products: ${womenProducts.reason?.message || 'Unknown error'}`);
      }

      if (successfulResults.length === 0) {
        throw new ProductFetchError(
          `All product fetches failed: ${errors.join('; ')}`,
          'NETWORK_ERROR'
        );
      }

      // ===========================================
      // IMPROVEMENT 14: RACE CONDITION PREVENTION
      // ===========================================
      if (currentRequestId !== requestIdRef.current) {
        return; // Silently ignore outdated response
      }

      const allProducts = successfulResults.flat();
      const uniqueProducts = deduplicateProducts(allProducts);

      setProducts(uniqueProducts);
      setTotalCount(uniqueProducts.length);
      setLoadingState('success');

      if (!isRefetch) {
        setCachedData(uniqueProducts, uniqueProducts.length);
        lastFetchTimeRef.current = Date.now();
      }

      metrics.fetchEndTime = Date.now();
      metrics.cacheHit = false;
      metrics.totalRetries = retryCountRef.current;
      metrics.dataSize = uniqueProducts.length;
      setPerformanceMetrics(metrics);

      if (import.meta.env.DEV) {
        const duration = metrics.fetchEndTime - metrics.fetchStartTime;
        console.log('[useProductData] Products loaded successfully', {
          productCount: uniqueProducts.length,
          totalFetched: allProducts.length,
          duplicatesRemoved: allProducts.length - uniqueProducts.length,
          duration: `${duration}ms`,
          cacheUsed: !isRefetch && !!getCachedData(),
          retries: metrics.totalRetries,
          partialErrors: errors.length > 0 ? errors : undefined,
          timestamp: new Date().toISOString()
        });
      }

    } catch (err) {
      // Enhanced error categorization
      if (err instanceof ProductFetchError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(`Failed to fetch products: ${err.message}`);
      } else {
        setError('An unexpected error occurred while fetching products');
      }

      setLoadingState('error');
      console.error('[useProductData] Error fetching products:', {
        error: err,
        requestId: currentRequestId,
        isRefetch,
        retryCount: retryCountRef.current,
        timestamp: new Date().toISOString()
      });

      setProducts([]);
      setTotalCount(0);

      // Clear cache on critical errors
      if (!isRefetch && err instanceof ProductFetchError && err.code !== 'CANCELLED') {
        clearCache();
      }

    } finally {
      if (currentRequestId === requestIdRef.current) {
        if (loadingState !== 'error' && loadingState !== 'success') {
          setLoadingState('idle');
        }
      }
    }
  }, [fetchProductsByGender, deduplicateProducts, getCachedData, setCachedData, clearCache]);

  // Force refresh function
  const refetch = useCallback(async () => {
    await fetchAllProducts(true);
  }, [fetchAllProducts]);

  // ===========================================
  // IMPROVEMENT 15: AUTOMATIC INITIAL FETCH
  // ===========================================
  useEffect(() => {
    fetchAllProducts();

    // Cleanup to prevent memory leaks
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllProducts]);

  // ===========================================
  // IMPROVEMENT 16: MEMOIZED RETURN VALUE
  // ===========================================
  /**
   * Memoized return value prevents unnecessary re-renders
   * Includes additional computed values for enhanced developer experience
   */
  const returnValue = useMemo(() => ({
    products,
    loading: loadingState === 'loading' || loadingState === 'refreshing',
    error,
    refetch,
    totalCount,

    // Additional computed values
    isRefreshing: loadingState === 'refreshing',
    isSuccess: loadingState === 'success',
    isIdle: loadingState === 'idle',
    isError: loadingState === 'error',
    lastUpdated: lastFetchTimeRef.current,
    hasCache: !!cacheRef.current,
    performanceMetrics,

    // Utility functions for developers
    clearCache,
    getCacheInfo: () => {
      const cache = cacheRef.current;
      return cache ? {
        timestamp: cache.timestamp,
        age: Date.now() - cache.timestamp,
        isValid: isCacheValid(cache),
        productCount: cache.data.length
      } : null;
    }
  }), [
    products,
    loadingState,
    error,
    refetch,
    totalCount,
    performanceMetrics,
    isCacheValid
  ]);

  return returnValue;
}
