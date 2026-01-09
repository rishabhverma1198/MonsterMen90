import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebsiteProductService, ProductFilters } from '../website-product.service';
import { supabase } from '@/lib/supabase';

describe('WebsiteProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ensure no injected errors/data remain
    (globalThis as any).setMockData({ products: [], categories: [] });
    (globalThis as any).setMockError('products', null);
    (globalThis as any).setMockError('categories', null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProducts', () => {
    it('fetches products with default pagination', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', base_price: 999, is_active: true },
        { id: '2', name: 'Product 2', base_price: 1499, is_active: true },
      ];

      (globalThis as any).setMockData({ products: mockProducts });

      const result = await WebsiteProductService.getProducts();

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('applies gender filter when provided', async () => {
      const products = [
        { id: '1', gender: 'men', name: 'M1', is_active: true },
        { id: '2', gender: 'women', name: 'W1', is_active: true },
      ];
      (globalThis as any).setMockData({ products });

      const filters: ProductFilters = { gender: 'men' };
      const res = await WebsiteProductService.getProducts(filters);

      expect(res.products).toHaveLength(1);
      expect(res.products[0].gender).toBe('men');
    });

    it('applies category filter when provided', async () => {
      const products = [
        { id: '1', category_id: 'cat-123', is_active: true },
        { id: '2', category_id: 'other', is_active: true },
      ];
      (globalThis as any).setMockData({ products });

      const filters: ProductFilters = { category: 'cat-123' };
      const res = await WebsiteProductService.getProducts(filters);
      expect(res.products).toHaveLength(1);
      expect(res.products[0].category_id).toBe('cat-123');
    });

    it('applies price range filters when provided', async () => {
      const products = [
        { id: '1', base_price: 400, is_active: true },
        { id: '2', base_price: 1500, is_active: true },
        { id: '3', base_price: 2500, is_active: true },
      ];
      (globalThis as any).setMockData({ products });

      const filters: ProductFilters = { min_price: 500, max_price: 2000 };
      const res = await WebsiteProductService.getProducts(filters);
      expect(res.products.every(p => p.base_price >= 500 && p.base_price <= 2000)).toBe(true);
    });

    it('applies featured filter when provided', async () => {
      const products = [
        { id: '1', is_featured: true, is_active: true },
        { id: '2', is_featured: false, is_active: true },
      ];
      (globalThis as any).setMockData({ products });

      const filters: ProductFilters = { featured: true };
      const res = await WebsiteProductService.getProducts(filters);
      expect(res.products.every(p => p.is_featured)).toBe(true);
    });

    it('applies search filter when provided', async () => {
      const products = [
        { id: '1', name: 'Cool Shirt', description: 'nice', brand: 'X', is_active: true },
        { id: '2', name: 'Pants', is_active: true },
      ];
      (globalThis as any).setMockData({ products });

      const filters: ProductFilters = { search: 'shirt' };
      const res = await WebsiteProductService.getProducts(filters);
      expect(res.products).toHaveLength(1);
      expect(res.products[0].name).toMatch(/shirt/i);
    });

    it('throws error when API returns error', async () => {
      (globalThis as any).setMockError('products', { message: 'Database error' });
      await expect(WebsiteProductService.getProducts()).rejects.toThrow(
        'Failed to fetch products: Database error'
      );
    });
  });

  describe('getFeaturedProducts', () => {
    it('fetches featured products with default limit', async () => {
      const products = [
        { id: '1', is_featured: true, is_active: true, name: 'F1' },
      ];
      (globalThis as any).setMockData({ products });

      const result = await WebsiteProductService.getFeaturedProducts();
      expect(result).toHaveLength(1);
    });

    it('respects custom limit parameter', async () => {
      (globalThis as any).setMockData({ products: [] });
      const result = await WebsiteProductService.getFeaturedProducts(4);
      expect(result).toHaveLength(0);
    });
  });

  describe('getProduct', () => {
    it('fetches single product by ID', async () => {
      (globalThis as any).setMockData({ products: [{ id: 'test-id', name: 'Test Product', is_active: true }] });
      const result = await WebsiteProductService.getProduct('test-id');
      expect(result).toEqual({ id: 'test-id', name: 'Test Product', is_active: true });
    });

    it('returns null when product not found (PGRST116)', async () => {
      (globalThis as any).setMockError('products', { code: 'PGRST116' });
      const result = await WebsiteProductService.getProduct('non-existent');
      expect(result).toBeNull();
    });

    it('throws error for other API errors', async () => {
      (globalThis as any).setMockError('products', { message: 'Server error', code: 'PGRST500' });
      await expect(WebsiteProductService.getProduct('test')).rejects.toThrow(
        'Failed to fetch product: Server error'
      );
    });
  });

  describe('getProductsByGender', () => {
    it('fetches products filtered by gender', async () => {
      (globalThis as any).setMockData({ products: [{ id: '1', gender: 'women', is_active: true }] });
      const result = await WebsiteProductService.getProductsByGender('women');
      expect(result).toHaveLength(1);
    });
  });

  describe('searchProducts', () => {
    it('searches products with query', async () => {
      (globalThis as any).setMockData({ products: [{ id: '1', name: 'Blue Shirt', is_active: true }] });
      const result = await WebsiteProductService.searchProducts('blue');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blue Shirt');
    });
  });

  describe('getCategories', () => {
    it('fetches active categories', async () => {
      (globalThis as any).setMockData({ categories: [
        { id: 'cat1', name: 'Shirts', slug: 'shirts', is_active: true, sort_order: 1 },
        { id: 'cat2', name: 'Pants', slug: 'pants', is_active: true, sort_order: 2 },
      ]});

      const result = await WebsiteProductService.getCategories();

      expect(result).toHaveLength(2);
    });

    it('throws error when fetching categories fails', async () => {
      (globalThis as any).setMockError('categories', { message: 'Categories table not found' });
      await expect(WebsiteProductService.getCategories()).rejects.toThrow(
        'Failed to fetch categories: Categories table not found'
      );
    });
  });
});

