import { supabase } from '../supabase';
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  ApiResponse,
  PaginatedResponse,
  OrderFilters,
  PaginationParams
} from '../../types/api-types';

/**
 * Order Service
 * Handles order management operations
 */
export class OrderService {

  /**
   * Get all orders with optional filters and pagination
   */
  static async getOrders(
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Order>> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          ),
          user:users (*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
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
        data: data as Order[],
        count: count || 0,
        error: null,
      };
    } catch {
      return {
        data: [],
        count: 0,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Get a single order by ID
   */
  static async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          ),
          user:users (*)
        `)
        .eq('id', id)
        .single();

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
        data: data as Order,
        error: null,
      };
    } catch {
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Create a new order
   */
  static async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      // Start a transaction-like operation
      // First create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: data.user_id,
          total_amount: data.total_amount,
          shipping_address: data.shipping_address,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        return {
          data: null,
          error: {
            message: orderError.message,
            status: 500,
          },
        };
      }

      // Then create order items
      const orderItems = data.order_items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // If order items fail, we should ideally delete the order
        // But for simplicity, we'll just return the error
        return {
          data: null,
          error: {
            message: itemsError.message,
            status: 500,
          },
        };
      }

      // Return the complete order with items
      return this.getOrder(order.id);
    } catch {
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(id: string, status: Order['status']): Promise<ApiResponse<Order>> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

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
        data: order as Order,
        error: null,
      };
    } catch {
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Update order information
   */
  static async updateOrder(id: string, data: UpdateOrderData): Promise<ApiResponse<Order>> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

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
        data: order as Order,
        error: null,
      };
    } catch {
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Get orders for current user
   */
  static async getCurrentUserOrders(pagination?: PaginationParams): Promise<PaginatedResponse<Order>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: [],
          count: 0,
          error: {
            message: 'No authenticated user',
            status: 401,
          },
        };
      }

      return this.getOrders({ user_id: user.id }, pagination);
    } catch {
      return {
        data: [],
        count: 0,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }
}