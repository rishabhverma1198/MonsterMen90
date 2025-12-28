import { useState, useCallback, useEffect, useRef } from 'react';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { WHOLESALE_CONFIG } from '@/lib/wholesale-constants';
import type { UseProductDataReturn } from '@/types/wholesale-types';

/**
 * Custom hook for managing product data fetching
 * Encapsulates all product fetching logic and state management
 */
export function useProductData(): UseProductDataReturn {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const hasFetched = useRef(false);

  const fetchAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all products for wholesaler (both men and women)
      const [menProducts, womenProducts] = await Promise.all([
        WebsiteProductService.getProductsByGender('men', WHOLESALE_CONFIG.DEFAULT_PAGE_SIZE),
        WebsiteProductService.getProductsByGender('women', WHOLESALE_CONFIG.DEFAULT_PAGE_SIZE)
      ]);
      
      // Combine and remove duplicates
      const allProducts = [...menProducts, ...womenProducts];
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      setProducts(uniqueProducts);
      setTotalCount(uniqueProducts.length);
      
      // Log performance metrics in development
      if (import.meta.env.DEV) {
        console.log(`[useProductData] Loaded ${uniqueProducts.length} unique products`);
      }
      
    } catch (err) {
      // Only log errors in development - don't show error state to users
      // This handles network issues gracefully by showing empty state
      if (import.meta.env.DEV) {
        console.warn('Error fetching products for wholesaler:', err);
      }
      
      // Set empty array - don't show error state, just show "no products"
      setProducts([]);
      setTotalCount(0);
      setError(null); // Don't show error, just empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAllProducts();
    }
  }, [fetchAllProducts]);

  const refetch = useCallback(async () => {
    await fetchAllProducts();
  }, [fetchAllProducts]);

  return {
    products,
    loading,
    error,
    refetch,
    totalCount
  };
}