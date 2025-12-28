export interface AdminProduct {
  id?: string;
  product_title: string;
  description?: string;
  short_description?: string;
  category_id: string;
  gender: 'Men' | 'Women' | 'Unisex';
  target_audience: 'buyer' | 'wholesaler' | 'both';
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  brand?: string;
  material?: string;
  care_instructions?: string;
  sku?: string;
  moq: number;
  stock_alert_threshold: number;
  generic_key?: string;
  unique_key?: string;
  sub_category?: string;
  is_active: boolean;
  is_featured: boolean;
  images?: string[];
  tags?: string[];
  colors?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface UseAdminProductsReturn {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  categories: { id: string; name: string; }[];
  fetchProducts: (filters?: {
    category?: string;
    active?: boolean;
    target_audience?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => Promise<AdminProduct[]>;
  createProduct: (productData: AdminProduct) => Promise<AdminProduct | null>;
  updateProduct: (id: string, updates: Partial<AdminProduct>) => Promise<AdminProduct | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  toggleProductStatus: (id: string, isActive: boolean) => Promise<AdminProduct | null>;
  fetchCategories: () => Promise<{ id: string; name: string; }[]>;
  getProduct: (id: string) => Promise<AdminProduct | null>;
  clearError: () => void;
  refreshProducts: () => Promise<AdminProduct[]>;
}

export interface AdminOrder {
  id: string;
  order_number: string;
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
  created_at: string;
  updated_at: string;
  users?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  order_items?: {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    variant_details?: any;
  }[];
}

export interface UseAdminOrdersReturn {
  orders: AdminOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: (filters?: {
    status?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }) => Promise<AdminOrder[]>;
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<AdminOrder | null>;
  getOrder: (id: string) => Promise<AdminOrder | null>;
  clearError: () => void;
  refreshOrders: () => Promise<AdminOrder[]>;
}

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  users: {
    total: number;
    buyers: number;
    wholesalers: number;
    admins: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  recentOrders: AdminOrder[];
  lowStockItems: AdminProduct[];
}

export interface UseAdminDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<DashboardStats | null>;
  clearError: () => void;
}