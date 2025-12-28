import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types/api-types';
import { AuthorizationService } from './authorization.service';
import { AuditLogger } from './audit.service';

// ============ ADMIN SERVICE TYPES ============

// Product types for admin service
export interface AdminProductCreate {
  name: string;
  description?: string;
  short_description?: string;
  category_id: string;
  gender: 'men' | 'women' | 'unisex';
  product_type: string;
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  sizes?: string[];
  images?: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  sku?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface AdminProductUpdate {
  name?: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  gender?: 'men' | 'women' | 'unisex';
  product_type?: string;
  base_price?: number;
  wholesale_price?: number;
  cost_price?: number;
  sizes?: string[];
  images?: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  sku?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

// Variant types for admin service
export interface AdminVariantUpdate {
  quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  price_adjustment?: number;
  size?: string;
  color?: string;
  sku?: string;
}

// Order types for admin service
export interface AdminOrderCreate {
  user_id: string;
  total_amount: number;
  status?: OrderStatus;
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  order_items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    size?: string;
    price: number;
  }[];
}

// User types for admin service
export interface AdminUserUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  user_type?: 'buyer' | 'wholeseller' | 'admin';
  is_active?: boolean;
  is_verified?: boolean;
}

// Category types for admin service
export interface AdminCategoryCreate {
  name: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
}

export interface AdminCategoryUpdate {
  name?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
}

// Discount types for admin service
export interface AdminDiscountCreate {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  min_purchase: number;
  max_uses?: number;
  valid_from: string;
  valid_until: string;
  is_active?: boolean;
}

export interface AdminDiscountUpdate {
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  description?: string;
  min_purchase?: number;
  max_uses?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

// Price rule types for admin service
export interface AdminPriceRuleCreate {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'bulk_quantity';
  value: number;
  min_quantity?: number;
  product_ids?: string[];
  category_ids?: string[];
  user_type?: 'buyer' | 'wholeseller';
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

// Filter types for admin service
export interface ProductFilters {
  category?: string;
  active?: boolean;
}

export interface VariantFilters {
  product?: string;
  lowStock?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  user?: string;
}

export interface UserFilters {
  role?: string;
  active?: boolean;
}

// ============ PRODUCT SERVICES ============

export const productService = {
  // Get all products
  async getProducts(filters?: ProductFilters) {
    try {
      const admin = await AuthorizationService.requirePermission('products:view');
      
      let query = supabase.from('products').select(`
        *,
        categories(name),
        product_variants(*)
      `);

      if (filters?.category) query = query.eq('category_id', filters.category);
      if (filters?.active !== undefined) query = query.eq('is_active', filters.active);

      const { data, error } = await query;
      
      await AuditLogger.logSuccess(admin, 'PRODUCTS_VIEWED', 'products', undefined, { filters });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCTS_VIEWED', error as Error, 'products', undefined, { filters });
      }
      throw error;
    }
  },

  // Get single product
  async getProduct(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('products:view');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_variants(*)
        `)
        .eq('id', id)
        .single();

      await AuditLogger.logSuccess(admin, 'PRODUCT_VIEWED', 'products', id);
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_VIEWED', error as Error, 'products', id);
      }
      throw error;
    }
  },

  // Create product
  async createProduct(product: AdminProductCreate) {
    try {
      const admin = await AuthorizationService.requirePermission('products:create');
      
      const { data, error } = await supabase.from('products').insert([product]).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_CREATED', 'products', data[0].id, { product });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCT_CREATED', error, 'products', undefined, { product });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_CREATED', error as Error, 'products', undefined, { product });
      }
      throw error;
    }
  },

  // Update product
  async updateProduct(id: string, updates: AdminProductUpdate) {
    try {
      const admin = await AuthorizationService.requirePermission('products:update');
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_UPDATED', 'products', id, { updates });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCT_UPDATED', error, 'products', id, { updates });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_UPDATED', error as Error, 'products', id, { updates });
      }
      throw error;
    }
  },

  // Delete product
  async deleteProduct(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('products:delete');
      
      const { data, error } = await supabase.from('products').delete().eq('id', id);
      
      if (!error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_DELETED', 'products', id);
      } else {
        await AuditLogger.logFailure(admin, 'PRODUCT_DELETED', error, 'products', id);
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_DELETED', error as Error, 'products', id);
      }
      throw error;
    }
  },

  // Bulk upload products
  async bulkCreateProducts(products: AdminProductCreate[]) {
    try {
      const admin = await AuthorizationService.requirePermission('products:create');
      
      const { data, error } = await supabase.from('products').insert(products).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCTS_BULK_CREATED', 'products', undefined, { count: products.length });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCTS_BULK_CREATED', error, 'products', undefined, { count: products.length });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCTS_BULK_CREATED', error as Error, 'products', undefined, { count: products.length });
      }
      throw error;
    }
  }
};

// ============ INVENTORY SERVICES ============

export const inventoryService = {
  // Get all variants
  async getVariants(filters?: VariantFilters) {
    try {
      const admin = await AuthorizationService.requirePermission('inventory:view');
      
      let query = supabase.from('product_variants').select(`
        *,
        products(name, base_price)
      `);

      if (filters?.product) query = query.eq('product_id', filters.product);
      if (filters?.lowStock) query = query.lte('quantity', 'min_stock_level');

      const { data, error } = await query;
      
      await AuditLogger.logSuccess(admin, 'INVENTORY_VIEWED', 'inventory', undefined, { filters });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'INVENTORY_VIEWED', error as Error, 'inventory', undefined, { filters });
      }
      throw error;
    }
  },

  // Update variant stock
  async updateVariantStock(id: string, quantity: number) {
    try {
      const admin = await AuthorizationService.requirePermission('inventory:update');
      
      const { data, error } = await supabase
        .from('product_variants')
        .update({ quantity })
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'INVENTORY_STOCK_UPDATED', 'inventory', id, { quantity });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'INVENTORY_STOCK_UPDATED', error, 'inventory', id, { quantity });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'INVENTORY_STOCK_UPDATED', error as Error, 'inventory', id, { quantity });
      }
      throw error;
    }
  },

  // Update variant
  async updateVariant(id: string, updates: AdminVariantUpdate) {
    try {
      const admin = await AuthorizationService.requirePermission('inventory:update');
      
      const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'INVENTORY_VARIANT_UPDATED', 'inventory', id, { updates });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'INVENTORY_VARIANT_UPDATED', error, 'inventory', id, { updates });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'INVENTORY_VARIANT_UPDATED', error as Error, 'inventory', id, { updates });
      }
      throw error;
    }
  },

  // Get low stock items
  async getLowStockItems() {
    try {
      const admin = await AuthorizationService.requirePermission('inventory:view');
      
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products(name, base_price)
        `)
        .lte('quantity', 'min_stock_level');

      await AuditLogger.logSuccess(admin, 'LOW_STOCK_VIEWED', 'inventory');
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'LOW_STOCK_VIEWED', error as Error, 'inventory');
      }
      throw error;
    }
  }
};

// ============ ORDER SERVICES ============

export const orderService = {
  // Get all orders
  async getOrders(filters?: OrderFilters) {
    try {
      const admin = await AuthorizationService.requirePermission('orders:view');
      
      let query = supabase.from('orders').select(`
        *,
        users(full_name, email),
        order_items(*)
      `).order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.user) query = query.eq('user_id', filters.user);

      const { data, error } = await query;
      
      await AuditLogger.logSuccess(admin, 'ORDERS_VIEWED', 'orders', undefined, { filters });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ORDERS_VIEWED', error as Error, 'orders', undefined, { filters });
      }
      throw error;
    }
  },

  // Get single order
  async getOrder(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('orders:view');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users(full_name, email, phone),
          order_items(*)
        `)
        .eq('id', id)
        .single();

      await AuditLogger.logSuccess(admin, 'ORDER_VIEWED', 'orders', id);
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ORDER_VIEWED', error as Error, 'orders', id);
      }
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(id: string, status: OrderStatus) {
    try {
      const admin = await AuthorizationService.requirePermission('orders:update');
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'ORDER_STATUS_UPDATED', 'orders', id, { status });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'ORDER_STATUS_UPDATED', error, 'orders', id, { status });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ORDER_STATUS_UPDATED', error as Error, 'orders', id, { status });
      }
      throw error;
    }
  },

  // Create order
  async createOrder(order: AdminOrderCreate) {
    try {
      const admin = await AuthorizationService.requirePermission('orders:update');
      
      const { data, error } = await supabase.from('orders').insert([order]).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'ORDER_CREATED', 'orders', data[0].id, { order });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'ORDER_CREATED', error, 'orders', undefined, { order });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ORDER_CREATED', error as Error, 'orders', undefined, { order });
      }
      throw error;
    }
  }
};

// ============ USER SERVICES ============

export const adminUserService = {
  // Get all users
  async getUsers(filters?: UserFilters) {
    try {
      const admin = await AuthorizationService.requirePermission('users:view');
      
      let query = supabase.from('users').select('*').order('created_at', { ascending: false });

      if (filters?.role) query = query.eq('user_type', filters.role);
      if (filters?.active !== undefined) query = query.eq('is_active', filters.active);

      const { data, error } = await query;
      
      await AuditLogger.logSuccess(admin, 'USERS_VIEWED', 'users', undefined, { filters });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'USERS_VIEWED', error as Error, 'users', undefined, { filters });
      }
      throw error;
    }
  },

  // Get single user
  async getUser(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('users:view');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_addresses(*)
        `)
        .eq('id', id)
        .single();

      await AuditLogger.logSuccess(admin, 'USER_VIEWED', 'users', id);
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'USER_VIEWED', error as Error, 'users', id);
      }
      throw error;
    }
  },

  // Update user
  async updateUser(id: string, updates: AdminUserUpdate) {
    try {
      const admin = await AuthorizationService.requirePermission('users:update');
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'USER_UPDATED', 'users', id, { updates });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'USER_UPDATED', error, 'users', id, { updates });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'USER_UPDATED', error as Error, 'users', id, { updates });
      }
      throw error;
    }
  },

  // Deactivate user
  async deactivateUser(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('users:deactivate');
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'USER_DEACTIVATED', 'users', id);
      } else if (error) {
        await AuditLogger.logFailure(admin, 'USER_DEACTIVATED', error, 'users', id);
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'USER_DEACTIVATED', error as Error, 'users', id);
      }
      throw error;
    }
  },

  // Get user activity
  async getUserActivity(userId: string) {
    try {
      const admin = await AuthorizationService.requirePermission('users:view');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      await AuditLogger.logSuccess(admin, 'USER_ACTIVITY_VIEWED', 'users', userId);
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'USER_ACTIVITY_VIEWED', error as Error, 'users', userId);
      }
      throw error;
    }
  }
};

// ============ CATEGORY SERVICES ============

export const categoryService = {
  // Get all categories
  async getCategories() {
    try {
      const admin = await AuthorizationService.requirePermission('products:view');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      await AuditLogger.logSuccess(admin, 'CATEGORIES_VIEWED', 'categories');
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'CATEGORIES_VIEWED', error as Error, 'categories');
      }
      throw error;
    }
  },

  // Create category
  async createCategory(category: AdminCategoryCreate) {
    try {
      const admin = await AuthorizationService.requirePermission('products:create');
      
      const { data, error } = await supabase.from('categories').insert([category]).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'CATEGORY_CREATED', 'categories', data[0].id, { category });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'CATEGORY_CREATED', error, 'categories', undefined, { category });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'CATEGORY_CREATED', error as Error, 'categories', undefined, { category });
      }
      throw error;
    }
  },

  // Update category
  async updateCategory(id: string, updates: AdminCategoryUpdate) {
    try {
      const admin = await AuthorizationService.requirePermission('products:update');
      
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'CATEGORY_UPDATED', 'categories', id, { updates });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'CATEGORY_UPDATED', error, 'categories', id, { updates });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'CATEGORY_UPDATED', error as Error, 'categories', id, { updates });
      }
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('products:delete');
      
      const { data, error } = await supabase.from('categories').delete().eq('id', id);
      
      if (!error) {
        await AuditLogger.logSuccess(admin, 'CATEGORY_DELETED', 'categories', id);
      } else {
        await AuditLogger.logFailure(admin, 'CATEGORY_DELETED', error, 'categories', id);
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'CATEGORY_DELETED', error as Error, 'categories', id);
      }
      throw error;
    }
  }
};

// ============ DISCOUNT SERVICES ============

export const discountService = {
  // Get all discounts
  async getDiscounts() {
    try {
      const admin = await AuthorizationService.requirePermission('discounts:view');
      
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      await AuditLogger.logSuccess(admin, 'DISCOUNTS_VIEWED', 'discounts');
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'DISCOUNTS_VIEWED', error as Error, 'discounts');
      }
      throw error;
    }
  },

  // Create discount
  async createDiscount(discount: AdminDiscountCreate) {
    try {
      const admin = await AuthorizationService.requirePermission('discounts:create');
      
      const { data, error } = await supabase.from('discounts').insert([discount]).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'DISCOUNT_CREATED', 'discounts', data[0].id, { discount });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'DISCOUNT_CREATED', error, 'discounts', undefined, { discount });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'DISCOUNT_CREATED', error as Error, 'discounts', undefined, { discount });
      }
      throw error;
    }
  },

  // Update discount
  async updateDiscount(id: string, updates: AdminDiscountUpdate) {
    try {
      const admin = await AuthorizationService.requirePermission('discounts:update');
      
      const { data, error } = await supabase
        .from('discounts')
        .update(updates)
        .eq('id', id)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'DISCOUNT_UPDATED', 'discounts', id, { updates });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'DISCOUNT_UPDATED', error, 'discounts', id, { updates });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'DISCOUNT_UPDATED', error as Error, 'discounts', id, { updates });
      }
      throw error;
    }
  },

  // Delete discount
  async deleteDiscount(id: string) {
    try {
      const admin = await AuthorizationService.requirePermission('discounts:delete');
      
      const { data, error } = await supabase.from('discounts').delete().eq('id', id);
      
      if (!error) {
        await AuditLogger.logSuccess(admin, 'DISCOUNT_DELETED', 'discounts', id);
      } else {
        await AuditLogger.logFailure(admin, 'DISCOUNT_DELETED', error, 'discounts', id);
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'DISCOUNT_DELETED', error as Error, 'discounts', id);
      }
      throw error;
    }
  }
};

// ============ ANALYTICS SERVICES ============

export const analyticsService = {
  // Get revenue data
  async getRevenueData(days: number = 30) {
    try {
      const admin = await AuthorizationService.requirePermission('analytics:view');
      
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'delivered');

      await AuditLogger.logSuccess(admin, 'ANALYTICS_REVENUE_VIEWED', 'analytics', undefined, { days });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ANALYTICS_REVENUE_VIEWED', error as Error, 'analytics', undefined, { days });
      }
      throw error;
    }
  },

  // Get top products
  async getTopProducts(limit: number = 10) {
    try {
      const admin = await AuthorizationService.requirePermission('analytics:view');
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_id,
          products(name)
        `)
        .limit(limit);

      await AuditLogger.logSuccess(admin, 'ANALYTICS_TOP_PRODUCTS_VIEWED', 'analytics', undefined, { limit });
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ANALYTICS_TOP_PRODUCTS_VIEWED', error as Error, 'analytics', undefined, { limit });
      }
      throw error;
    }
  },

  // Get customer metrics
  async getCustomerMetrics() {
    try {
      const admin = await AuthorizationService.requirePermission('analytics:view');
      
      const { data: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'buyer');

      const { data: newUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'buyer')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      await AuditLogger.logSuccess(admin, 'ANALYTICS_CUSTOMER_METRICS_VIEWED', 'analytics');
      return { totalUsers, newUsers, error: null };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ANALYTICS_CUSTOMER_METRICS_VIEWED', error as Error, 'analytics');
      }
      throw error;
    }
  },

  // Get sales by category
  async getSalesByCategory() {
    try {
      const admin = await AuthorizationService.requirePermission('analytics:view');
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_id,
          products(category_id, categories(name))
        `);

      await AuditLogger.logSuccess(admin, 'ANALYTICS_SALES_BY_CATEGORY_VIEWED', 'analytics');
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'ANALYTICS_SALES_BY_CATEGORY_VIEWED', error as Error, 'analytics');
      }
      throw error;
    }
  }
};

// ============ PRICE SERVICES ============

export const priceService = {
  // Get all price rules
  async getPriceRules() {
    try {
      const admin = await AuthorizationService.requirePermission('pricing:view');
      
      const { data, error } = await supabase
        .from('price_rules')
        .select('*')
        .order('created_at', { ascending: false });

      await AuditLogger.logSuccess(admin, 'PRICING_RULES_VIEWED', 'pricing');
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRICING_RULES_VIEWED', error as Error, 'pricing');
      }
      throw error;
    }
  },

  // Create price rule
  async createPriceRule(rule: AdminPriceRuleCreate) {
    try {
      const admin = await AuthorizationService.requirePermission('pricing:update');
      
      const { data, error } = await supabase.from('price_rules').insert([rule]).select();
      
      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'PRICING_RULE_CREATED', 'pricing', data[0].id, { rule });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRICING_RULE_CREATED', error, 'pricing', undefined, { rule });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRICING_RULE_CREATED', error as Error, 'pricing', undefined, { rule });
      }
      throw error;
    }
  },

  // Update product price
  async updateProductPrice(productId: string, price: number) {
    try {
      const admin = await AuthorizationService.requirePermission('pricing:update');
      
      const { data, error } = await supabase
        .from('products')
        .update({ base_price: price })
        .eq('id', productId)
        .select();

      if (data && !error) {
        await AuditLogger.logSuccess(admin, 'PRODUCT_PRICE_UPDATED', 'products', productId, { price });
      } else if (error) {
        await AuditLogger.logFailure(admin, 'PRODUCT_PRICE_UPDATED', error, 'products', productId, { price });
      }
      
      return { data, error };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, 'PRODUCT_PRICE_UPDATED', error as Error, 'products', productId, { price });
      }
      throw error;
    }
  }
};
