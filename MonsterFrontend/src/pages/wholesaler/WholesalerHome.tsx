import { useEffect, useMemo, useCallback, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/common/BackButton';
import { FilterSection } from '@/components/wholesale/FilterSection';
import { ProductGrid } from '@/components/wholesale/ProductGrid';
import { useProductData } from '@/hooks/useProductData';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useFilteredProducts } from '@/hooks/useFilteredProducts';
import { usePerformanceMonitor } from '@/hooks/useOptimizedLoading';
import { Package, AlertCircle, Loader2 } from 'lucide-react';
import type { WebsiteProduct } from '@/lib/services/website-product.service';

// Constants
const WHOLESALE_CONFIG = {
  MINIMUM_ORDER_QUANTITY: 20,
  PERFORMANCE_THRESHOLD_MS: 16,
  PAGINATION_SIZE: 50,
} as const;

const DEV_CONFIG = {
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.DEV,
  ENABLE_DEBUG_LOGGING: import.meta.env.DEV,
} as const;

// Types
interface ProductActionHandler {
  (product: WebsiteProduct, action: 'view' | 'add-to-cart'): void;
}

interface LoadingStateProps {
  isInitialLoad: boolean;
  isRefreshing: boolean;
}

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  productCount: number;
}

// Constants extraction for better maintainability
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to load products. Please check your internet connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Memoized components for performance
const LoadingState = memo(({ isInitialLoad, isRefreshing }: LoadingStateProps) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
      <Loader2 className={`w-6 h-6 animate-spin ${isInitialLoad ? '' : 'opacity-50'}`} />
      <span className="text-lg font-medium">
        {isInitialLoad ? 'Loading products...' : 'Refreshing products...'}
      </span>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 text-center max-w-md">
      {isInitialLoad 
        ? 'Fetching the latest wholesale products for you'
        : 'Updating product inventory...'
      }
    </p>
  </div>
));

const EmptyState = memo(({ hasFilters, onClearFilters, productCount }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {hasFilters ? 'No products match your filters' : 'No products available'}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
      {hasFilters 
        ? 'Try adjusting your search criteria or clearing filters to see more products.'
        : 'Check back later for new wholesale products or contact support if this persists.'
      }
    </p>
    {hasFilters && (
      <Button
        onClick={onClearFilters}
        variant="outline"
        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Clear Filters
      </Button>
    )}
  </div>
));

const ErrorState = memo(({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) => {
  const getErrorType = useCallback((errorMessage: string): 'network' | 'server' | 'unknown' => {
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
      return 'network';
    }
    if (errorMessage.toLowerCase().includes('server') || errorMessage.toLowerCase().includes('500')) {
      return 'server';
    }
    return 'unknown';
  }, []);

  const errorType = getErrorType(error);
  const errorMessageMap = {
    network: ERROR_MESSAGES.NETWORK_ERROR,
    server: ERROR_MESSAGES.SERVER_ERROR,
    unknown: ERROR_MESSAGES.UNKNOWN_ERROR,
  } as const;
  
  const displayMessage = errorMessageMap[errorType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Unable to Load Products
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {displayMessage}
          </p>
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
});

const PerformanceMetrics = memo(({ 
  totalCount, 
  filteredCount, 
  filterTime 
}: { 
  totalCount: number; 
  filteredCount: number; 
  filterTime: number; 
}) => {
  if (!DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-xs font-mono shadow-lg border border-gray-700 dark:border-gray-300">
      <div className="space-y-1">
        <div>Total: {totalCount}</div>
        <div>Filtered: {filteredCount}</div>
        <div>Filter Time: {filterTime.toFixed(2)}ms</div>
      </div>
    </div>
  );
});

/**
 * Enhanced WholesalerHome component with improved performance, 
 * better error handling, and enhanced user experience
 */
const WholesalerHome = memo(() => {
  // Performance monitoring - only in development
  const performanceMonitor = DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING 
    ? usePerformanceMonitor('WholesalerHome')
    : null;

  // Custom hooks for state management
  const { 
    products, 
    loading, 
    error, 
    refetch, 
    totalCount
  } = useProductData();
  
  const { 
    filters, 
    setSearchTerm, 
    setSelectedGender, 
    setSortBy, 
    clearFilters 
  } = useProductFilters();
  
  const { 
    filteredProducts, 
    performanceMetrics 
  } = useFilteredProducts(products, filters);

  // Memoized values for performance
  const hasFilters = useMemo(() => {
    return Boolean(
      filters.searchTerm || 
      filters.selectedGender !== 'all' || 
      filters.sortBy !== 'name'
    );
  }, [filters.searchTerm, filters.selectedGender, filters.sortBy]);

  const performanceWarning = useMemo(() => {
    return performanceMetrics.filterTime > WHOLESALE_CONFIG.PERFORMANCE_THRESHOLD_MS;
  }, [performanceMetrics.filterTime]);

  // Product action handlers with proper error handling
  const handleProductAction: ProductActionHandler = useCallback((product, action) => {
    try {
      switch (action) {
        case 'view':
          // TODO: Implement product detail view with proper navigation
          console.log('Navigate to product:', product.id, product.name);
          // Example: navigate(`/products/${product.id}`);
          break;
        case 'add-to-cart':
          // TODO: Implement add to cart functionality with validation
          console.log('Add to cart:', product.id, product.name);
          // Example: addToCart(product, WHOLESALE_CONFIG.MINIMUM_ORDER_QUANTITY);
          break;
        default:
          console.warn('Unknown product action:', action);
      }
    } catch (error) {
      console.error('Product action failed:', error);
      // TODO: Show user-friendly error message
    }
  }, []);

  // Performance measurement - only in development
  useEffect(() => {
    if (DEV_CONFIG.ENABLE_PERFORMANCE_MONITORING && performanceMonitor) {
      performanceMonitor.measureRender();
    }
  });

  // Development logging
  useEffect(() => {
    if (DEV_CONFIG.ENABLE_DEBUG_LOGGING && products.length > 0) {
      console.log('[WholesalerHome] Performance metrics:', {
        totalProducts: totalCount,
        filteredProducts: filteredProducts.length,
        filterTime: performanceMetrics.filterTime.toFixed(2) + 'ms',
        renderCount: performanceMonitor?.metrics.renderCount || 'N/A'
      });
    }
  }, [
    products.length, 
    totalCount, 
    filteredProducts.length, 
    performanceMetrics.filterTime,
    performanceMonitor
  ]);

  // Error state with retry functionality
  if (error) {
    return (
      <ErrorState 
        error={error} 
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <BackButton showText={false} to="/" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Wholesaler Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Bulk purchase • Minimum {WHOLESALE_CONFIG.MINIMUM_ORDER_QUANTITY} pieces per product • {filteredProducts.length} products available
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {filteredProducts.length} Products
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Available for wholesale
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Filters Section */}
        <FilterSection
          filters={filters}
          onFilterChange={{
            setSearchTerm,
            setSelectedGender,
            setSortBy,
            clearFilters
          }}
          productCount={filteredProducts.length}
        />

        {/* Products Section */}
        <section className="mb-8" aria-label="Products">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Available Products
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredProducts.length} products found
                {performanceWarning && DEV_CONFIG.ENABLE_DEBUG_LOGGING && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-2" role="alert">
                    (Filtered in {performanceMetrics.filterTime.toFixed(1)}ms)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && products.length === 0 && (
            <LoadingState 
              isInitialLoad={true} 
              isRefreshing={false} 
            />
          )}

          {/* Products Grid or Empty State */}
          {!loading && filteredProducts.length === 0 ? (
            <EmptyState 
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
              productCount={filteredProducts.length}
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              loading={loading}
              onProductAction={handleProductAction}
            />
          )}

          {/* Refreshing Indicator */}
          {loading && products.length > 0 && (
            <div className="flex justify-center py-4">
              <LoadingState 
                isInitialLoad={false} 
                isRefreshing={true} 
              />
            </div>
          )}
        </section>
      </main>

      {/* Performance Metrics in Development */}
      <PerformanceMetrics 
        totalCount={totalCount}
        filteredCount={filteredProducts.length}
        filterTime={performanceMetrics.filterTime}
      />
    </div>
  );
});

// Display name for debugging
WholesalerHome.displayName = 'WholesalerHome';

export default WholesalerHome;