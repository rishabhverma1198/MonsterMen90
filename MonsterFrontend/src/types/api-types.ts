/* =========================
   📦 API TYPES
   ========================= */

// Base types
export type UserRole = 'buyer' | 'wholeseller' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// User types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  full_name?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  sizes: string[] | null; // JSONB array of sizes
  images: string[] | null; // JSONB array of image URLs
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  category: string;
  sizes?: string[];
  images?: string[];
  stock_quantity?: number;
  is_active?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  sizes?: string[];
  images?: string[];
  stock_quantity?: number;
  is_active?: boolean;
}

// Order types
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  price: number; // Price at time of order
  created_at: string;
  product?: Product;
}

export interface CreateOrderData {
  user_id: string;
  total_amount: number;
  shipping_address?: ShippingAddress;
  order_items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  product_id: string;
  quantity: number;
  size?: string;
  price: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  shipping_address?: ShippingAddress;
}

// Cart types
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  added_at: string;
  product?: Product;
}

export interface AddToCartData {
  product_id: string;
  quantity: number;
  size?: string;
}

export interface UpdateCartItemData {
  quantity: number;
}

// Authentication types
export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User | null;
  session: unknown; // Supabase Session type
  error: {
    message: string;
    status?: number;
  } | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    status?: number;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: {
    message: string;
    status?: number;
  } | null;
}

// Query parameters
export interface ProductFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  user_id?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}