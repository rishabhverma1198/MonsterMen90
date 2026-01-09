import { Product, Order, User } from './api-types';

export interface AdminProduct extends Product {
  cost_price: number;
  margin: number;
  moq: number;
  stock_alert_threshold: number;
  is_featured: boolean;
}

export interface AdminDashboardStats {
  inventory: {
    totalValue: number;
    stockOutRate: number;
    lowStockCount: number;
    topCategories: Array<{ name: string; value: number }>;
  };
  orders: {
    count: number;
    pendingValue: number;
    averageOrderValue: number;
  };
  customers: {
    total: number;
    activeWholesalers: number;
    retentionRate: number;
  };
  revenue: {
    daily: number[];
    monthlyTotal: number;
    growthPercentage: number;
  };
}

export interface UseAdminProductsReturn {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  actions: {
    upsert: (data: Partial<AdminProduct>) => Promise<void>;
    remove: (id: string) => Promise<boolean>;
    bulkUpdateStatus: (ids: string[], active: boolean) => Promise<void>;
    exportToCsv: () => void;
  };
}

export interface AdminOrderExtended extends Order {
  customer: Pick<User, 'full_name' | 'email' | 'metadata'>;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}