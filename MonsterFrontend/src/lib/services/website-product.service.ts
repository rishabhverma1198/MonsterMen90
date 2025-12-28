import { supabase } from '@/lib/supabase';

/**
 * Website Product Service
 * Provides products to the main website (buyer/wholeseller sections)
 * Only shows active products from admin
 */
export interface WebsiteProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  gender: 'men' | 'women' | 'unisex';
  product_type: string;
  base_price: number;
  wholesale_price?: number;
  images: string[];
  brand?: string;
  material?: string;
  available_sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
  };
  product_variants: Array<{
    id: string;
    size: string;
    color?: string;
    stock_quantity: number;
    price: number;
    sku: string;
  }>;
}

export interface ProductFilters {
  gender?: 'men' | 'women' | 'unisex';
  category?: string;
  product_type?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
  search?: string;
}

export class WebsiteProductService {

  /**
   * Get all active products for the website
   */
  static async getProducts(filters?: ProductFilters, limit = 20, offset = 0): Promise<{
    products: WebsiteProduct[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }

      if (filters?.min_price) {
        query = query.gte('base_price', filters.min_price);
      }

      if (filters?.max_price) {
        query = query.lte('base_price', filters.max_price);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      // If in_stock filter is specified, only include products with stock
      if (filters?.in_stock) {
        query = query.gt('product_variants.stock_quantity', 0);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Order by featured first, then by creation date
      query = query.order('is_featured', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      return {
        products: data as WebsiteProduct[] || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error fetching website products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID for website display
   */
  static async getProduct(id: string): Promise<WebsiteProduct | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        throw new Error(`Failed to fetch product: ${error.message}`);
      }

      return data as WebsiteProduct;
    } catch (error) {
      console.error('Error fetching website product:', error);
      throw error;
    }
  }

  /**
   * Get products by category for website
   */
  static async getProductsByCategory(categoryId: string, limit = 20): Promise<WebsiteProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch products by category: ${error.message}`);
      }

      return data as WebsiteProduct[] || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  /**
   * Get featured products for website homepage
   */
  static async getFeaturedProducts(limit = 8): Promise<WebsiteProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch featured products: ${error.message}`);
      }

      return data as WebsiteProduct[] || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  /**
   * Get products by gender for website
   */
  static async getProductsByGender(gender: 'men' | 'women' | 'unisex', limit = 20): Promise<WebsiteProduct[]> {
    try {
      // Try with gender filter first
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_active', true);

      // Add gender filter if column exists, otherwise get all products
      try {
        query = query.eq('gender', gender);
      } catch (e) {
        // If gender column doesn't exist, get all products
        console.warn('Gender column not found, fetching all products');
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch products by gender: ${error.message}`);
      }

      return data as WebsiteProduct[] || [];
    } catch (error) {
      console.error('Error fetching products by gender:', error);
      throw error;
    }
  }

  /**
   * Search products for website
   */
  static async searchProducts(query: string, limit = 20): Promise<WebsiteProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,material.ilike.%${query}%`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to search products: ${error.message}`);
      }

      return data as WebsiteProduct[] || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get related products for product detail page
   */
  static async getRelatedProducts(productId: string, categoryId?: string, gender?: string, limit = 4): Promise<WebsiteProduct[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_active', true)
        .neq('id', productId);

      // If category is specified, prioritize same category
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // If gender is specified, include same gender products
      if (gender) {
        query = query.eq('gender', gender);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch related products: ${error.message}`);
      }

      return data as WebsiteProduct[] || [];
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  }

  /**
   * Get all categories for website navigation
   */
  static async getCategories(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
    product_count?: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}