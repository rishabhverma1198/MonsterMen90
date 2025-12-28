import { useState, useCallback } from 'react';
import { adminAPI, type AdminProduct } from '../lib/services/admin-api.service';
import type { UseAdminProductsReturn } from '../types/admin-types';

export function useAdminProducts(): UseAdminProductsReturn {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);

  // Helper function to handle errors safely
  const handleError = (result: any): string => {
    if (result.error) {
      const message = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? (result.error as any).message 
        : 'An error occurred';
      return message;
    }
    return '';
  };

  // Fetch all products
  const fetchProducts = useCallback(async (filters?: {
    category?: string;
    active?: boolean;
    target_audience?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminProduct[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.getProducts(filters);
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      const productsData = result.data || [];
      setProducts(productsData);
      return productsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new product
  const createProduct = useCallback(async (productData: AdminProduct): Promise<AdminProduct | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.createProduct(productData);
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      if (result.data) {
        setProducts(prev => [result.data!, ...prev]);
        return result.data;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing product
  const updateProduct = useCallback(async (id: string, updates: Partial<AdminProduct>): Promise<AdminProduct | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.updateProduct(id, updates);
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      if (result.data) {
        setProducts(prev => prev.map(p => p.id === id ? result.data! : p));
        return result.data;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.deleteProduct(id);
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      console.error('Error deleting product:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle product status
  const toggleProductStatus = useCallback(async (id: string, isActive: boolean): Promise<AdminProduct | null> => {
    return await updateProduct(id, { is_active: isActive });
  }, [updateProduct]);

  // Fetch categories
  const fetchCategories = useCallback(async (): Promise<{ id: string; name: string; }[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.getCategories();
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      const categoriesData = result.data || [];
      setCategories(categoriesData);
      return categoriesData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single product
  const getProduct = useCallback(async (id: string): Promise<AdminProduct | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminAPI.getProduct(id);
      
      if (result.error) {
        throw new Error(handleError(result));
      }

      return result.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
      console.error('Error fetching product:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh products
  const refreshProducts = useCallback(async (): Promise<AdminProduct[]> => {
    return await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    categories,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    fetchCategories,
    getProduct,
    clearError,
    refreshProducts
  };
}