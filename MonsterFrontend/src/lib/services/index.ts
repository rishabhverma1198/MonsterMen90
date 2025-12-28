/**
 * API Services
 * Centralized exports for all API service classes
 */

export { AuthService } from './auth.service';
export { ProductService } from './product.service';
export { UserService } from './user.service';
export { OrderService } from './order.service';
export { CartService } from './cart.service';

// Re-export types for convenience
export type {
  // User types
  User,
  UserRole,
  CreateUserData,
  UpdateUserData,

  // Product types
  Product,
  CreateProductData,
  UpdateProductData,

  // Order types
  Order,
  OrderItem,
  OrderStatus,
  ShippingAddress,
  CreateOrderData,
  CreateOrderItemData,
  UpdateOrderData,

  // Cart types
  CartItem,
  AddToCartData,
  UpdateCartItemData,

  // Auth types
  SignInData,
  SignUpData,
  AuthResponse,

  // Response types
  ApiResponse,
  PaginatedResponse,

  // Filter and pagination types
  ProductFilters,
  OrderFilters,
  PaginationParams,
} from '../../types/api-types';