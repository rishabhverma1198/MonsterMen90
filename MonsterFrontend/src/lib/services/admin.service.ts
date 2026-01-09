import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types/api-types';
import { AuthorizationService } from './authorization.service';
import { AuditLogger } from './audit.service';

// ============ TYPE DEFINITIONS ============

// Core entity IDs
export type EntityId = string;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Base filter interfaces
export interface BaseFilters {
  isActive?: boolean;
}

// Product types
export interface AdminProductCreate {
  name: string;
  description?: string;
  short_description?: string;
  category_id: EntityId;
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
  category_id?: EntityId;
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

export interface ProductFilters extends BaseFilters {
  category?: EntityId;
  search?: string;
}

// Variant types
export interface AdminVariantUpdate {
  quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  price_adjustment?: number;
  size?: string;
  color?: string;
  sku?: string;
}

export interface VariantFilters {
  product?: EntityId;
  lowStock?: boolean;
  color?: string;
}

// Order types
export interface AdminOrderCreate {
  user_id: EntityId;
  total_amount: number;
  status?: OrderStatus;
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  order_items: Array<{
    product_id: EntityId;
    variant_id?: EntityId;
    quantity: number;
    size?: string;
    price: number;
  }>;
}

export interface OrderFilters {
  status?: OrderStatus;
  user?: EntityId;
  dateFrom?: string;
  dateTo?: string;
}

// User types
export interface AdminUserCreate {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  user_type: 'buyer' | 'wholeseller' | 'admin' | 'moderator';
  is_active: boolean;
}

export interface AdminUserUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  user_type?: 'buyer' | 'wholeseller' | 'admin' | 'moderator';
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserFilters extends BaseFilters {
  role?: string;
  search?: string;
}

// Category types
export interface AdminCategoryCreate {
  name: string;
  description?: string;
  parent_id?: EntityId;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
}

export interface AdminCategoryUpdate {
  name?: string;
  description?: string;
  parent_id?: EntityId;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
}

// Discount types
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

// Price rule types
export interface AdminPriceRuleCreate {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'bulk_quantity';
  value: number;
  min_quantity?: number;
  product_ids?: EntityId[];
  category_ids?: EntityId[];
  user_type?: 'buyer' | 'wholeseller';
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

// ============ SERVICE RESULT TYPES ============

export type ServiceResult<T> = Promise<{
  data: T | null;
  error: Error | null;
  success: boolean;
}>;

// ============ BASE SERVICE CLASS ============

/**
 * Base service class providing common functionality for all admin services
 * Reduces code duplication and ensures consistent error handling
 */
abstract class BaseService {
  protected abstract getPermissionPrefix(): string;

  /**
   * Execute an operation with consistent authorization and logging
   */
  protected async execute<T>(
    operation: string,
    action: () => Promise<{ data: T; error: Error | null }>,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<ServiceResult<T>> {
    try {
      const admin = await AuthorizationService.requirePermission(
        `${this.getPermissionPrefix()}:${operation}` as any
      );

      const result = await action();

      if (result.data && !result.error) {
        await AuditLogger.logSuccess(admin, `${operation.toUpperCase()}_EXECUTED`, resourceType, resourceId, metadata);
      } else if (result.error) {
        await AuditLogger.logFailure(admin, operation.toUpperCase(), result.error, resourceType, resourceId, metadata);
      }

      return {
        data: result.data,
        error: result.error,
        success: !result.error
      };
    } catch (error) {
      const admin = await AuthorizationService.getCurrentAdmin();
      if (admin) {
        await AuditLogger.logFailure(admin, operation.toUpperCase(), error as Error, resourceType, resourceId, metadata);
      }
      throw error;
    }
  }

  /**
   * Build pagination query parameters
   */
  protected buildPaginationParams(params?: PaginationParams): { from: number; to: number } {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
  }
}

// ============ PRODUCT SERVICE ============

class ProductService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'products';
  }

  async getProducts(filters?: ProductFilters, pagination?: PaginationParams): Promise<ServiceResult<AdminProductCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { from, to } = this.buildPaginationParams(pagination);
        
        let query = supabase
          .from('products')
          .select(`
            *,
            categories(name),
            product_variants(*)
          `, { count: 'exact' });

        if (filters?.category) {
          query = query.eq('category_id', filters.category);
        }
        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }
        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        query = query
          .range(from, to)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        return { data: data as AdminProductCreate[], error: error ? new Error(error.message) : null };
      },
      'products',
      undefined,
      { filters, pagination }
    );
  }

  async getProduct(id: string): Promise<ServiceResult<AdminProductCreate>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name),
            product_variants(*)
          `)
          .eq('id', id)
          .single();

        return { data: data as AdminProductCreate, error: error ? new Error(error.message) : null };
      },
      'products',
      id
    );
  }

  async createProduct(product: AdminProductCreate): Promise<ServiceResult<AdminProductCreate>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
          .single();

        return { data: data as AdminProductCreate, error: error ? new Error(error.message) : null };
      },
      'products',
      undefined,
      { product }
    );
  }

  async updateProduct(id: string, updates: AdminProductUpdate): Promise<ServiceResult<AdminProductUpdate>> {
    return this.execute(
      'update',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        return { data: data as AdminProductUpdate, error: error ? new Error(error.message) : null };
      },
      'products',
      id,
      { updates }
    );
  }

  async deleteProduct(id: string): Promise<ServiceResult<void>> {
    return this.execute(
      'delete',
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'products',
      id
    );
  }

  async bulkCreateProducts(products: AdminProductCreate[]): Promise<ServiceResult<AdminProductCreate[]>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .insert(products)
          .select();

        return { data: data as AdminProductCreate[], error: error ? new Error(error.message) : null };
      },
      'products',
      undefined,
      { count: products.length }
    );
  }

  async toggleFeatured(id: string, isFeatured: boolean): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const { error } = await supabase
          .from('products')
          .update({ is_featured: isFeatured })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'products',
      id,
      { isFeatured }
    );
  }
}

// ============ INVENTORY SERVICE ============

class InventoryService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'inventory';
  }

  async getVariants(filters?: VariantFilters, pagination?: PaginationParams): Promise<ServiceResult<AdminVariantUpdate[]>> {
    return this.execute(
      'view',
      async () => {
        const { from, to } = this.buildPaginationParams(pagination);
        
        let query = supabase
          .from('product_variants')
          .select(`
            *,
            products(name, base_price)
          `, { count: 'exact' });

        if (filters?.product) {
          query = query.eq('product_id', filters.product);
        }
        if (filters?.lowStock) {
          query = query.lte('quantity', 10);
        }
        if (filters?.color) {
          query = query.eq('color', filters.color);
        }

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error } = await query;
        return { data: data as AdminVariantUpdate[], error: error ? new Error(error.message) : null };
      },
      'inventory',
      undefined,
      { filters, pagination }
    );
  }

  async updateVariantStock(id: string, quantity: number, reason?: string): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const { error } = await supabase
          .from('product_variants')
          .update({ 
            quantity,
            last_stock_update: new Date().toISOString()
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'inventory',
      id,
      { quantity, reason }
    );
  }

  async updateVariant(id: string, updates: AdminVariantUpdate): Promise<ServiceResult<AdminVariantUpdate>> {
    return this.execute(
      'update',
      async () => {
        const { data, error } = await supabase
          .from('product_variants')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data: data as AdminVariantUpdate, error: error ? new Error(error.message) : null };
      },
      'inventory',
      id,
      { updates }
    );
  }

  async getLowStockItems(): Promise<ServiceResult<AdminVariantUpdate[]>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('product_variants')
          .select(`
            *,
            products(name, base_price, sku)
          `);

        if (error) {
          return { data: [], error: new Error(error.message) };
        }

        // Filter in memory for variants with low stock
        interface VariantData {
          quantity: number | null;
          min_stock_level: number | null;
        }
        const lowStockItems = (data as VariantData[] | null)?.filter(v => (v.quantity ?? 0) <= (v.min_stock_level ?? 10)) ?? [];
        
        return { data: lowStockItems as AdminVariantUpdate[], error: null };
      },
      'inventory'
    );
  }

  async adjustStock(id: string, adjustment: number, reason: string): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        // First get current stock
        const { data: variant, error: fetchError } = await supabase
          .from('product_variants')
          .select('quantity')
          .eq('id', id)
          .single();

        if (fetchError) {
          return { data: undefined, error: new Error(fetchError.message) };
        }

        const newQuantity = Math.max(0, (variant.quantity ?? 0) + adjustment);
        
        const { error } = await supabase
          .from('product_variants')
          .update({
            quantity: newQuantity,
            last_stock_update: new Date().toISOString()
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'inventory',
      id,
      { adjustment, reason }
    );
  }
}

// ============ ORDER SERVICE ============

class OrderService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'orders';
  }

  async getOrders(filters?: OrderFilters, pagination?: PaginationParams): Promise<ServiceResult<AdminOrderCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { from, to } = this.buildPaginationParams(pagination);
        
        let query = supabase
          .from('orders')
          .select(`
            *,
            users(full_name, email),
            order_items(*)
          `, { count: 'exact' })
          .order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.user) {
          query = query.eq('user_id', filters.user);
        }
        if (filters?.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }

        query = query.range(from, to);

        const { data, error } = await query;
        return { data: data as AdminOrderCreate[], error: error ? new Error(error.message) : null };
      },
      'orders',
      undefined,
      { filters, pagination }
    );
  }

  async getOrder(id: string): Promise<ServiceResult<AdminOrderCreate>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            users(full_name, email, phone),
            order_items(*)
          `)
          .eq('id', id)
          .single();

        return { data: data as AdminOrderCreate, error: error ? new Error(error.message) : null };
      },
      'orders',
      id
    );
  }

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({ 
            status,
            updated_at: new Date().toISOString(),
            status_notes: notes ?? null
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'orders',
      id,
      { status, notes }
    );
  }

  async createOrder(order: AdminOrderCreate): Promise<ServiceResult<AdminOrderCreate>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .insert([order])
          .select()
          .single();

        return { data: data as AdminOrderCreate, error: error ? new Error(error.message) : null };
      },
      'orders',
      undefined,
      { order }
    );
  }

  async cancelOrder(id: string, reason: string): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            cancellation_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'orders',
      id,
      { reason }
    );
  }
}

// ============ USER SERVICE ============

class UserService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'users';
  }

  async getUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<ServiceResult<AdminUserCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { from, to } = this.buildPaginationParams(pagination);
        
        let query = supabase
          .from('users')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (filters?.role) {
          query = query.eq('user_type', filters.role);
        }
        if (filters?.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }
        if (filters?.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        query = query.range(from, to);

        const { data, error } = await query;
        return { data: data as AdminUserCreate[], error: error ? new Error(error.message) : null };
      },
      'users',
      undefined,
      { filters, pagination }
    );
  }

  async getUser(id: string): Promise<ServiceResult<AdminUserCreate>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            user_addresses(*)
          `)
          .eq('id', id)
          .single();

        return { data: data as AdminUserCreate, error: error ? new Error(error.message) : null };
      },
      'users',
      id
    );
  }

  async createUser(user: AdminUserCreate): Promise<ServiceResult<AdminUserCreate>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('users')
          .insert([user])
          .select()
          .single();

        return { data: data as AdminUserCreate, error: error ? new Error(error.message) : null };
      },
      'users',
      undefined,
      { user }
    );
  }

  async updateUser(id: string, updates: AdminUserUpdate): Promise<ServiceResult<AdminUserUpdate>> {
    return this.execute(
      'update',
      async () => {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data: data as AdminUserUpdate, error: error ? new Error(error.message) : null };
      },
      'users',
      id,
      { updates }
    );
  }

  async deactivateUser(id: string): Promise<ServiceResult<void>> {
    return this.execute(
      'deactivate',
      async () => {
        const { error } = await supabase
          .from('users')
          .update({ 
            is_active: false,
            deactivated_at: new Date().toISOString()
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'users',
      id
    );
  }

  async reactivateUser(id: string): Promise<ServiceResult<void>> {
    return this.execute(
      'activate',
      async () => {
        const { error } = await supabase
          .from('users')
          .update({ 
            is_active: true,
            reactivated_at: new Date().toISOString()
          })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'users',
      id
    );
  }

  async getUserActivity(userId: string): Promise<ServiceResult<AdminOrderCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        return { data: data as AdminOrderCreate[], error: error ? new Error(error.message) : null };
      },
      'users',
      userId
    );
  }
}

// ============ CATEGORY SERVICE ============

class CategoryService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'products';
  }

  async getCategories(): Promise<ServiceResult<AdminCategoryCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        return { data: data as AdminCategoryCreate[], error: error ? new Error(error.message) : null };
      },
      'categories'
    );
  }

  async createCategory(category: AdminCategoryCreate): Promise<ServiceResult<AdminCategoryCreate>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .insert([category])
          .select()
          .single();

        return { data: data as AdminCategoryCreate, error: error ? new Error(error.message) : null };
      },
      'categories',
      undefined,
      { category }
    );
  }

  async updateCategory(id: string, updates: AdminCategoryUpdate): Promise<ServiceResult<AdminCategoryUpdate>> {
    return this.execute(
      'update',
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data: data as AdminCategoryUpdate, error: error ? new Error(error.message) : null };
      },
      'categories',
      id,
      { updates }
    );
  }

  async deleteCategory(id: string): Promise<ServiceResult<void>> {
    return this.execute(
      'delete',
      async () => {
        // Check for products in this category before deletion
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', id);

        if (countError) {
          return { data: undefined, error: new Error(countError.message) };
        }

        if (count && count > 0) {
          return { data: undefined, error: new Error(`Cannot delete category with ${count} products. Move or delete products first.`) };
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'categories',
      id
    );
  }

  async reorderCategories(categories: Array<{ id: string; sort_order: number }>): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const operations = categories.map(cat => ({
          id: cat.id,
          sort_order: cat.sort_order
        }));

        const { error } = await supabase
          .from('categories')
          .upsert(operations);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'categories',
      undefined,
      { count: categories.length }
    );
  }
}

// ============ DISCOUNT SERVICE ============

class DiscountService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'discounts';
  }

  async getDiscounts(): Promise<ServiceResult<AdminDiscountCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('discounts')
          .select('*')
          .order('created_at', { ascending: false });

        return { data: data as AdminDiscountCreate[], error: error ? new Error(error.message) : null };
      },
      'discounts'
    );
  }

  async createDiscount(discount: AdminDiscountCreate): Promise<ServiceResult<AdminDiscountCreate>> {
    return this.execute(
      'create',
      async () => {
        // Validate discount dates
        if (new Date(discount.valid_from) >= new Date(discount.valid_until)) {
          return { data: null, error: new Error('valid_from must be before valid_until') };
        }

        const { data, error } = await supabase
          .from('discounts')
          .insert([discount])
          .select()
          .single();

        return { data: data as AdminDiscountCreate, error: error ? new Error(error.message) : null };
      },
      'discounts',
      undefined,
      { discount }
    );
  }

  async updateDiscount(id: string, updates: AdminDiscountUpdate): Promise<ServiceResult<AdminDiscountUpdate>> {
    return this.execute(
      'update',
      async () => {
        const { data, error } = await supabase
          .from('discounts')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data: data as AdminDiscountUpdate, error: error ? new Error(error.message) : null };
      },
      'discounts',
      id,
      { updates }
    );
  }

  async deleteDiscount(id: string): Promise<ServiceResult<void>> {
    return this.execute(
      'delete',
      async () => {
        const { error } = await supabase.from('discounts').delete().eq('id', id);
        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'discounts',
      id
    );
  }

  async toggleDiscount(id: string, isActive: boolean): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const { error } = await supabase
          .from('discounts')
          .update({ is_active: isActive })
          .eq('id', id);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'discounts',
      id,
      { isActive }
    );
  }
}

// ============ ANALYTICS SERVICE ============

class AnalyticsService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'analytics';
  }

  async getRevenueData(days: number = 30): Promise<ServiceResult<Array<{ total_amount: number; created_at: string }>>> {
    return this.execute(
      'view',
      async () => {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .gte('created_at', startDate)
          .eq('status', 'delivered');

        return { data: data as Array<{ total_amount: number; created_at: string }>, error: error ? new Error(error.message) : null };
      },
      'analytics',
      undefined,
      { days }
    );
  }

  async getTopProducts(limit: number = 10): Promise<ServiceResult<Array<{ quantity: number; product_id: string; product_name: string }>>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            quantity,
            product_id,
            products(name)
          `)
          .limit(limit);

        interface OrderItemProductData {
          quantity: number;
          product_id: string;
          products: { name: string } | null;
        }

        const processedData = (data as OrderItemProductData[] | null)?.map(item => {
          const productData = item.products;
          const productName = productData?.name ?? 'Unknown';
          return {
            quantity: item.quantity ?? 0,
            product_id: item.product_id ?? '',
            product_name: productName
          };
        }) ?? [];

        return { data: processedData, error: error ? new Error(error.message) : null };
      },
      'analytics',
      undefined,
      { limit }
    );
  }

  async getCustomerMetrics(): Promise<ServiceResult<{ totalUsers: number; newUsers: number }>> {
    return this.execute(
      'view',
      async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: totalUsers }, { count: newUsers }] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'buyer'),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'buyer').gte('created_at', thirtyDaysAgo)
        ]);

        return { 
          data: { 
            totalUsers: totalUsers ?? 0, 
            newUsers: newUsers ?? 0 
          }, 
          error: null 
        };
      },
      'analytics'
    );
  }

  async getSalesByCategory(): Promise<ServiceResult<Array<{ category_name: string; total_quantity: number; total_revenue: number }>>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            products(category_id, categories(name))
          `);

        if (error) {
          return { data: null, error: new Error(error.message) };
        }

        // Aggregate by category
        interface OrderItemWithCategory {
          quantity: number | null;
          price: number | null;
          products: { categories?: Array<{ name: string }> } | null;
        }
        const categoryMap = new Map<string, { quantity: number; revenue: number }>();
        
        for (const item of (data as OrderItemWithCategory[] | null) ?? []) {
          const categoriesData = (item.products?.categories ?? []) as Array<{ name: string }>;
          const categoryName = categoriesData[0]?.name ?? 'Uncategorized';
          const existing = categoryMap.get(categoryName) ?? { quantity: 0, revenue: 0 };
          categoryMap.set(categoryName, {
            quantity: existing.quantity + (item.quantity ?? 0),
            revenue: existing.revenue + (item.quantity ?? 0) * (item.price ?? 0)
          });
        }

        const result = Array.from(categoryMap.entries()).map(([name, stats]) => ({
          category_name: name,
          total_quantity: stats.quantity,
          total_revenue: stats.revenue
        }));

        return { data: result, error: null };
      },
      'analytics'
    );
  }

  async getDashboardStats(): Promise<ServiceResult<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    lowStockCount: number;
  }>> {
    return this.execute(
      'view',
      async () => {
        const [ordersResult, variantsResult] = await Promise.all([
          supabase.from('orders').select('total_amount, status', { count: 'exact' }),
          supabase.from('product_variants').select('*')
        ]);

        const totalOrders = ordersResult.count ?? 0;
        
        interface OrderData {
          status: string | null;
          total_amount: number | null;
        }
        interface VariantData {
          quantity: number | null;
        }
        
        const pendingOrders = (ordersResult.data as OrderData[] | null)?.filter((o: OrderData) => o.status === 'pending').length ?? 0;
        const totalRevenue = (ordersResult.data as OrderData[] | null)?.reduce((sum: number, o: OrderData) => sum + (o.total_amount ?? 0), 0) ?? 0;
        
        // Get low stock count by filtering in memory
        const lowStockCount = (variantsResult.data as VariantData[] | null)?.filter((v: VariantData) => (v.quantity ?? 0) <= 10).length ?? 0;

        return { 
          data: { totalOrders, pendingOrders, totalRevenue, lowStockCount }, 
          error: null 
        };
      },
      'analytics'
    );
  }
}

// ============ PRICE SERVICE ============

class PriceService extends BaseService {
  protected getPermissionPrefix(): string {
    return 'pricing';
  }

  async getPriceRules(): Promise<ServiceResult<AdminPriceRuleCreate[]>> {
    return this.execute(
      'view',
      async () => {
        const { data, error } = await supabase
          .from('price_rules')
          .select('*')
          .order('created_at', { ascending: false });

        return { data: data as AdminPriceRuleCreate[], error: error ? new Error(error.message) : null };
      },
      'pricing'
    );
  }

  async createPriceRule(rule: AdminPriceRuleCreate): Promise<ServiceResult<AdminPriceRuleCreate>> {
    return this.execute(
      'create',
      async () => {
        const { data, error } = await supabase
          .from('price_rules')
          .insert([rule])
          .select()
          .single();

        return { data: data as AdminPriceRuleCreate, error: error ? new Error(error.message) : null };
      },
      'pricing',
      undefined,
      { rule }
    );
  }

  async updateProductPrice(productId: string, price: number): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        if (price < 0) {
          return { data: undefined, error: new Error('Price cannot be negative') };
        }

        const { error } = await supabase
          .from('products')
          .update({ 
            base_price: price,
            price_updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'products',
      productId,
      { price }
    );
  }

  async bulkUpdatePrices(updates: Array<{ productId: string; price: number }>): Promise<ServiceResult<void>> {
    return this.execute(
      'update',
      async () => {
        const operations = updates.map(u => ({
          id: u.productId,
          base_price: u.price,
          price_updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('products').upsert(operations);
        return { data: undefined, error: error ? new Error(error.message) : null };
      },
      'products',
      undefined,
      { count: updates.length }
    );
  }
}

// ============ EXPORT SINGLETON INSTANCES ============

export const productService = new ProductService();
export const inventoryService = new InventoryService();
export const orderService = new OrderService();
export const adminUserService = new UserService();
export const categoryService = new CategoryService();
export const discountService = new DiscountService();
export const analyticsService = new AnalyticsService();
export const priceService = new PriceService();
