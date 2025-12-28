import { supabase } from '../supabase';
import type { AdminProduct } from '../../types/admin-types';

// Simplified Admin API Service
// This service provides a clean, working interface for admin operations

// Re-export AdminProduct type for backward compatibility
export type { AdminProduct };

export interface AdminOrder {
  id?: string;
  order_number?: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency?: string;
  shipping_address: any;
  billing_address: any;
  notes?: string;
}

export interface AdminVariant {
  id?: string;
  product_id: string;
  size: string;
  color?: string;
  color_hex?: string;
  sku?: string;
  stock_quantity: number;
  min_stock_level: number;
  price: number;
  wholesale_price?: number;
  weight?: number;
  dimensions?: any;
}

export class AdminAPIService {
  private static instance: AdminAPIService;

  public static getInstance(): AdminAPIService {
    if (!AdminAPIService.instance) {
      AdminAPIService.instance = new AdminAPIService();
    }
    return AdminAPIService.instance;
  }

  // ============ PRODUCT OPERATIONS ============

  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: {
    category?: string;
    active?: boolean;
    target_audience?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name, slug),
          product_variants(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }
      if (filters?.target_audience) {
        query = query.eq('target_audience', filters.target_audience);
      }
      if (filters?.search) {
        query = query.or(`product_title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, error: null, count };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { data: null, error, count: 0 };
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, slug),
          product_variants(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching product:', error);
      return { data: null, error };
    }
  }

  /**
   * Create new product
   */
  async createProduct(product: AdminProduct) {
    try {
      // Prepare product data
      const productData = {
        product_title: product.product_title,
        description: product.description || '',
        short_description: product.short_description || '',
        category_id: product.category_id,
        gender: product.gender,
        target_audience: product.target_audience,
        base_price: product.base_price,
        wholesale_price: product.wholesale_price,
        cost_price: product.cost_price,
        brand: product.brand || '',
        material: product.material || '',
        care_instructions: product.care_instructions || '',
        sku: product.sku || '',
        moq: product.moq || 1,
        stock_alert_threshold: product.stock_alert_threshold || 10,
        generic_key: product.generic_key || '',
        unique_key: product.unique_key || '',
        sub_category: product.sub_category || '',
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        images: product.images || [],
        tags: product.tags || [],
        colors: product.colors || [],
        weight: product.weight,
        dimensions: product.dimensions
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating product:', error);
      return { data: null, error };
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id: string, updates: Partial<AdminProduct>) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating product:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error };
    }
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(id: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error toggling product status:', error);
      return { data: null, error };
    }
  }

  // ============ VARIANT/INVENTORY OPERATIONS ============

  /**
   * Get product variants
   */
  async getProductVariants(productId: string) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size');

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching variants:', error);
      return { data: null, error };
    }
  }

  /**
   * Create or update variant stock
   */
  async updateVariantStock(variantId: string, stockData: {
    stock_quantity: number;
    min_stock_level?: number;
    price?: number;
    wholesale_price?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .update({
          ...stockData,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating variant stock:', error);
      return { data: null, error };
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    try {
      const { data, error } = await supabase
        .from('admin_low_stock_alerts')
        .select('*');

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return { data: null, error };
    }
  }

  // ============ ORDER OPERATIONS ============

  /**
   * Get orders with filters
   */
  async getOrders(filters?: {
    status?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          users(full_name, email, phone),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { data: null, error };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Set timestamps based on status
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          users(full_name, email),
          order_items(*)
        `)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { data: null, error };
    }
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select(`
          *,
          users(full_name)
        `)
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching order status history:', error);
      return { data: null, error };
    }
  }

  // ============ CATEGORY OPERATIONS ============

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error };
    }
  }

  /**
   * Create new category
   */
  async createCategory(category: {
    name: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    image_url?: string;
  }) {
    try {
      const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          slug,
          is_active: category.is_active !== false
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating category:', error);
      return { data: null, error };
    }
  }

  // ============ DASHBOARD ANALYTICS ============

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      // Get basic counts
      const [productsResult, ordersResult, usersResult, lowStockResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.rpc('get_low_stock_count')
      ]);

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get order status summary
      const { data: orderSummary } = await supabase
        .from('admin_order_summary')
        .select('*');

      return {
        data: {
          products: { total: productsResult.count || 0 },
          orders: { total: ordersResult.count || 0 },
          users: { total: usersResult.count || 0 },
          lowStock: { count: lowStockResult.data || 0 },
          recentOrders: recentOrders || [],
          orderSummary: orderSummary || []
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: null, error };
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Check if user is admin
   */
  async checkAdminAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      return profile?.user_type === 'admin';
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  }

  /**
   * Get current admin user
   */
  async getCurrentAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('user_type', 'admin')
        .single();

      return profile;
    } catch (error) {
      console.error('Error fetching current admin:', error);
      return null;
    }
  }
}

// Export singleton instance
export const adminAPI = AdminAPIService.getInstance();