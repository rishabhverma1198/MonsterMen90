import { useMemo } from 'react';
import type { WebsiteProduct } from '@/lib/services/website-product.service';
import type { ProductFilters, UseFilteredProductsReturn } from '@/types/wholesale-types';

/**
 * Custom hook for memoized product filtering and sorting
 * Replaces the useEffect anti-pattern with proper useMemo usage
 * for derived state calculation
 */
export function useFilteredProducts(
  products: WebsiteProduct[],
  filters: ProductFilters
): UseFilteredProductsReturn {
  const { filteredProducts, filterTime, productCount } = useMemo(() => {
    const startTime = performance.now();

    // Early return if no products
    if (!products.length) {
      return {
        filteredProducts: [],
        filterTime: 0,
        productCount: 0
      };
    }

    let filtered = [...products];

    // Filter by search term (debounced)
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.short_description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by gender
    if (filters.selectedGender !== 'all') {
      filtered = filtered.filter(product => product.gender === filters.selectedGender);
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
    }

    const endTime = performance.now();
    const timeTaken = endTime - startTime;

    // Log performance metrics in development
    if (import.meta.env.DEV && timeTaken > 16) { // If filter takes longer than one frame
      console.warn(`[useFilteredProducts] Slow filtering: ${timeTaken.toFixed(2)}ms for ${products.length} products`);
    }

    return {
      filteredProducts: filtered,
      filterTime: timeTaken,
      productCount: filtered.length
    };
  }, [products, filters]);

  const performanceMetrics = useMemo(() => ({
    filterTime,
    productCount
  }), [filterTime, productCount]);

  return {
    filteredProducts,
    performanceMetrics
  };
}