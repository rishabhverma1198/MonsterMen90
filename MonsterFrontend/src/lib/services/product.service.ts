 import { supabase } from '../supabase';
import { AuthorizationService } from './authorization.service';
import { AuditLogger } from './audit.service';
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
  PaginationParams
} from '../../types/api-types';

/**
 * Product Service
 * Handles product CRUD operations with ADMIN AUTHORIZATION
 */
export class ProductService {

  /**
   * Get all products with optional filters and pagination
   */
  static async getProducts(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    try {
      // Require admin permission to view products
      const admin = await AuthorizationService.requirePermission('products:view');
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (pagination?.limit) {
        const from = pagination.page ? (pagination.page - 1) * pagination.limit : 0;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      await AuditLogger.logSuccess(admin, 'PRODUCTS_VIEWED', 'products', undefined, { filters, pagination });

      if (error) {
        return {
          data: [],
          count: 0,
          error: {
            message: error.message,
            status: 500,
          },
        };
      }

      return {
        data: data as Product[],
        count: count || 0,
        error: null,
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCTS_VIEWED', error as Error, 'products', undefined, { filters, pagination });
      }
      return {
        data: [],
        count: 0,
        error: {
          message: error instanceof Error ? error.message : 'Authorization failed',
          status: 403,
        },
      };
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      // Require admin permission to view individual product
      const admin = await AuthorizationService.requirePermission('products:view');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      await AuditLogger.logSuccess(admin, 'PRODUCT_VIEWED', 'products', id);

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: error.code === 'PGRST116' ? 404 : 500,
          },
        };
      }

      return {
        data: data as Product,
        error: null,
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_VIEWED', error as Error, 'products', id);
      }
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Authorization failed',
          status: 403,
        },
      };
    }
  }

  /**
   * Create a new product (ADMIN ONLY - Requires explicit permission)
   */
  static async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      // Require admin permission to create products
      const admin = await AuthorizationService.requirePermission('products:create');
      
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          sizes: data.sizes,
          images: data.images,
          stock_quantity: data.stock_quantity || 0,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (product && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_CREATED', 'products', product.id, { product: data });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCT_CREATED', error, 'products', undefined, { product: data });
      }

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: 500,
          },
        };
      }

      return {
        data: product as Product,
        error: null,
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_CREATED', error as Error, 'products', undefined, { product: data });
      }
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Authorization failed',
          status: 403,
        },
      };
    }
  }

  /**
   * Update an existing product (ADMIN ONLY - Requires explicit permission)
   */
  static async updateProduct(id: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
    try {
      // Require admin permission to update products
      const admin = await AuthorizationService.requirePermission('products:update');
      
      const { data: product, error } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (product && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_UPDATED', 'products', id, { updates: data });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCT_UPDATED', error, 'products', id, { updates: data });
      }

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: error.code === 'PGRST116' ? 404 : 500,
          },
        };
      }

      return {
        data: product as Product,
        error: null,
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_UPDATED', error as Error, 'products', id, { updates: data });
      }
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Authorization failed',
          status: 403,
        },
      };
    }
  }

  /**
   * Delete a product (ADMIN ONLY - Requires explicit permission)
   */
  static async deleteProduct(id: string): Promise<ApiResponse<null>> {
    try {
      // Require admin permission to delete products
      const admin = await AuthorizationService.requirePermission('products:delete');
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (!error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_DELETED', 'products', id);
      } else {
        await AuditLogger.logFailure(admin, 'PRODUCT_DELETED', error, 'products', id);
      }

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: error.code === 'PGRST116' ? 404 : 500,
          },
        };
      }

      return {
        data: null,
        error: null,
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_DELETED', error as Error, 'products', id);
      }
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Authorization failed',
          status: 403,
        },
      };
    }
  }

  /**
   * Get products by category (ADMIN ONLY)
   */
  static async getProductsByCategory(category: string): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ category, is_active: true });
  }

  /**
   * Search products (ADMIN ONLY)
   */
  static async searchProducts(query: string): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ search: query, is_active: true });
  }
}