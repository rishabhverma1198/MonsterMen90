import type { OrderStatus } from '@/types/api-types';
import { apiService } from './api.service';

// Product types for API service
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
  target_audience?: 'buyer' | 'wholesaler' | 'both';
  moq?: number;
  stock_alert_threshold?: number;
  generic_key?: string;
  unique_key?: string;
  sub_category?: string;
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
  target_audience?: 'buyer' | 'wholesaler' | 'both';
  moq?: number;
  stock_alert_threshold?: number;
  generic_key?: string;
  unique_key?: string;
  sub_category?: string;
}

export interface AdminVariantUpdate {
  quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  price_adjustment?: number;
  size?: string;
  color?: string;
  sku?: string;
}

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

export interface AdminUserUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  user_type?: 'buyer' | 'wholesaler' | 'admin';
  is_active?: boolean;
  is_verified?: boolean;
}

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

export interface AdminPriceRuleCreate {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'bulk_quantity';
  value: number;
  min_quantity?: number;
  product_ids?: string[];
  category_ids?: string[];
  user_type?: 'buyer' | 'wholesaler';
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

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

// Website product types
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

// Product API Service
export const productApiService = {
  // Admin product operations
  async getProducts(filters?: ProductFilters) {
    return await apiService.get('/products/admin', filters);
  },

  async getProduct(id: string) {
    return await apiService.get(`/products/admin/${id}`);
  },

  async createProduct(product: AdminProductCreate) {
    return await apiService.post('/products/admin', product);
  },

  async updateProduct(id: string, updates: AdminProductUpdate) {
    return await apiService.put(`/products/admin/${id}`, updates);
  },

  async deleteProduct(id: string) {
    return await apiService.delete(`/products/admin/${id}`);
  },

  async bulkCreateProducts(products: AdminProductCreate[]) {
    return await apiService.post('/products/admin/bulk', products);
  },

  // Website product operations
  async getWebsiteProducts(filters?: any): Promise<import('./api.service').ApiResponse<{
    products: WebsiteProduct[];
    total: number;
    hasMore: boolean;
  }>> {
    return await apiService.get('/products', filters);
  },

  async getWebsiteProduct(id: string): Promise<import('./api.service').ApiResponse<WebsiteProduct>> {
    return await apiService.get(`/products/${id}`);
  },

  async getProductsByCategory(categoryId: string, limit = 20): Promise<import('./api.service').ApiResponse<WebsiteProduct[]>> {
    return await apiService.get(`/products/category/${categoryId}`, { limit });
  },

  async getFeaturedProducts(limit = 8): Promise<import('./api.service').ApiResponse<WebsiteProduct[]>> {
    return await apiService.get(`/products/featured/${limit}`);
  },

  async getProductsByGender(gender: 'men' | 'women' | 'unisex', limit = 20): Promise<import('./api.service').ApiResponse<WebsiteProduct[]>> {
    return await apiService.get(`/products/gender/${gender}`, { limit });
  },

  async searchProducts(query: string, limit = 20): Promise<import('./api.service').ApiResponse<WebsiteProduct[]>> {
    return await apiService.get(`/products/search/${encodeURIComponent(query)}`, { limit });
  },

  async getRelatedProducts(productId: string, categoryId?: string, gender?: string, limit = 4): Promise<import('./api.service').ApiResponse<WebsiteProduct[]>> {
    const params: any = { limit };
    if (categoryId) params.category = categoryId;
    if (gender) params.gender = gender;
    return await apiService.get(`/products/${productId}/related`, params);
  },

  async getCategories(): Promise<import('./api.service').ApiResponse<Array<{
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
    product_count?: number;
  }>>> {
    return await apiService.get('/users/categories');
  }
};

// Inventory API Service
export const inventoryApiService = {
  async getVariants(filters?: VariantFilters) {
    return await apiService.get('/inventory/admin', filters);
  },

  async updateVariantStock(id: string, quantity: number) {
    return await apiService.put(`/inventory/admin/${id}/stock`, { quantity });
  },

  async updateVariant(id: string, updates: AdminVariantUpdate) {
    return await apiService.put(`/inventory/admin/${id}`, updates);
  },

  async getLowStockItems() {
    return await apiService.get('/inventory/admin/low-stock');
  },

  // Analytics
  async getRevenueData(days: number = 30) {
    return await apiService.get('/inventory/admin/analytics/revenue', { days });
  },

  async getTopProducts(limit: number = 10) {
    return await apiService.get('/inventory/admin/analytics/top-products', { limit });
  },

  async getCustomerMetrics() {
    return await apiService.get('/inventory/admin/analytics/customers');
  },

  async getSalesByCategory() {
    return await apiService.get('/inventory/admin/analytics/sales-by-category');
  }
};

// User API Service
export const userApiService = {
  async getUsers(filters?: UserFilters) {
    return await apiService.get('/users/admin', filters);
  },

  async getUser(id: string) {
    return await apiService.get(`/users/admin/${id}`);
  },

  async updateUser(id: string, updates: AdminUserUpdate) {
    return await apiService.put(`/users/admin/${id}`, updates);
  },

  async deactivateUser(id: string) {
    return await apiService.patch(`/users/admin/${id}/deactivate`, {});
  },

  async getUserActivity(userId: string) {
    return await apiService.get(`/users/admin/${userId}/activity`);
  },

  async getCategories() {
    return await apiService.get('/users/categories');
  },

  async createCategory(category: AdminCategoryCreate) {
    return await apiService.post('/users/categories/admin', category);
  },

  async updateCategory(id: string, updates: AdminCategoryUpdate) {
    return await apiService.put(`/users/categories/admin/${id}`, updates);
  },

  async deleteCategory(id: string) {
    return await apiService.delete(`/users/categories/admin/${id}`);
  }
};

// Order API Service
export const orderApiService = {
  async getOrders(filters?: OrderFilters) {
    return await apiService.get('/orders/admin', filters);
  },

  async getOrder(id: string) {
    return await apiService.get(`/orders/admin/${id}`);
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    return await apiService.put(`/orders/admin/${id}/status`, { status });
  },

  async createOrder(order: AdminOrderCreate) {
    return await apiService.post('/orders/admin', order);
  },

  async getDiscounts() {
    return await apiService.get('/orders/discounts/admin');
  },

  async createDiscount(discount: AdminDiscountCreate) {
    return await apiService.post('/orders/discounts/admin', discount);
  },

  async updateDiscount(id: string, updates: AdminDiscountUpdate) {
    return await apiService.put(`/orders/discounts/admin/${id}`, updates);
  },

  async deleteDiscount(id: string) {
    return await apiService.delete(`/orders/discounts/admin/${id}`);
  },

  async getPriceRules() {
    return await apiService.get('/orders/pricing/admin');
  },

  async createPriceRule(rule: AdminPriceRuleCreate) {
    return await apiService.post('/orders/pricing/admin', rule);
  },

  async updateProductPrice(productId: string, price: number) {
    return await apiService.put(`/orders/pricing/product/${productId}`, { price });
  }
};