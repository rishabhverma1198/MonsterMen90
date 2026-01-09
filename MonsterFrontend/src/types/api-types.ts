/* =========================
   📦 CORE API TYPES (Industry Standard)
   ========================= */

export type UserRole = 'buyer' | 'wholesaler' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface UserMetadata {
  phone?: string;
  business_name?: string;
  tax_id?: string; // GST/VAT for clothing business
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  metadata?: UserMetadata;
  created_at: string;
  updated_at: string;
}

// Clothing specific Product Schema
export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  wholesale_price: number | null;
  category: string;
  sub_category?: string;
  tags: string[];
  attributes: {
    material?: string;
    fit?: string;
    care_instructions?: string;
    gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  };
  variants: ProductVariant[];
  images: ProductImage[];
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  color_hex?: string;
  sku_extension: string;
  additional_price: number;
  stock_quantity: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  is_thumbnail: boolean;
  order: number;
}

// Transactional Types
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_status: 'unpaid' | 'partial' | 'paid';
  shipping_address: ShippingAddress;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  variant_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
}

// Response Wrappers
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
};

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Auth Types
export interface AuthResponse {
  user: User | null;
  session: any | null; // Supabase session
  error: {
    message: string;
    status: number;
  } | null;
}

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