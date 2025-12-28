import { Package } from 'lucide-react';
import { VirtualList } from '@/components/ui/virtual-list';
import { WholesaleProductCard } from './WholesaleProductCard';
import { WHOLESALE_CONFIG } from '@/lib/wholesale-constants';
import type { ProductGridProps } from '@/types/wholesale-types';
import type { WebsiteProduct } from '@/lib/services/website-product.service';

/**
 * Product grid component with virtual scrolling optimization
 * Automatically switches to virtual list when product count exceeds threshold
 */
export function ProductGrid({
  products,
  loading,
  onProductAction,
  viewMode: _viewMode = 'grid',
  className = ''
}: ProductGridProps) {
  const shouldUseVirtualList = products.length > WHOLESALE_CONFIG.VIRTUAL_LIST_THRESHOLD;

  const handleViewProduct = (product: WebsiteProduct) => {
    onProductAction(product, 'view');
  };

  const handleAddToCart = (product: WebsiteProduct) => {
    onProductAction(product, 'add-to-cart');
  };

  // Render a single product card
  const renderProductCard = (product: WebsiteProduct) => (
    <div key={product.id} className="h-full">
      <WholesaleProductCard
        product={product}
        onView={handleViewProduct}
        onAddToCart={handleAddToCart}
        className="h-full"
      />
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="w-12 h-12 text-blue-500 dark:text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No Products Found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        No wholesale products match your current criteria. Try adjusting your filters to see more results.
      </p>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
          <div className="h-48 sm:h-56 bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <LoadingState />;
  }

  if (products.length === 0) {
    return <EmptyState />;
  }

  // Use virtual list for large datasets
  if (shouldUseVirtualList) {
    const estimatedCardHeight = 500; // Approximate height including margins
    const gridHeight = 600; // Container height for virtual scrolling

    return (
      <div className={className}>
        <VirtualList
          items={products}
          itemHeight={estimatedCardHeight}
          height={gridHeight}
          renderItem={renderProductCard}
          className="virtual-product-grid"
          overscan={3}
          aria-label="Wholesale products virtual list"
        />
        
        {/* Performance info for development */}
        {import.meta.env.DEV && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Using virtual scrolling for {products.length} products
          </div>
        )}
      </div>
    );
  }

  // Use regular grid for smaller datasets
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <WholesaleProductCard
          key={product.id}
          product={product}
          onView={handleViewProduct}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}