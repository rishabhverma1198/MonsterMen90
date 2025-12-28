import { supabase } from '../supabase';
import type {
  CartItem,
  AddToCartData,
  UpdateCartItemData,
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../../types/api-types';

/**
 * Cart Service
 * Handles shopping cart operations
 */
export class CartService {

  /**
   * Get cart items for current user
   */
  static async getCart(pagination?: PaginationParams): Promise<PaginatedResponse<CartItem>> {
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

      let query = supabase
        .from('cart')
        .select(`
          *,
          product:products (*)
        `, { count: 'exact' })
        .eq('user_id', user.id);

      // Apply pagination
      if (pagination?.limit) {
        const from = pagination.page ? (pagination.page - 1) * pagination.limit : 0;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      // Order by added_at desc
      query = query.order('added_at', { ascending: false });

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
        data: data as CartItem[],
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
   * Add item to cart
   */
  static async addToCart(data: AddToCartData): Promise<ApiResponse<CartItem>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: {
            message: 'No authenticated user',
            status: 401,
          },
        };
      }

      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', data.product_id)
        .eq('size', data.size || null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return {
          data: null,
          error: {
            message: checkError.message,
            status: 500,
          },
        };
      }

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + data.quantity;
        return this.updateCartItem(existingItem.id, { quantity: newQuantity });
      }

      // Add new item to cart
      const { data: cartItem, error } = await supabase
        .from('cart')
        .insert({
          user_id: user.id,
          product_id: data.product_id,
          quantity: data.quantity,
          size: data.size,
        })
        .select(`
          *,
          product:products (*)
        `)
        .single();

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: 500,
          },
        };
      }

      return {
        data: cartItem as CartItem,
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
   * Update cart item quantity
   */
  static async updateCartItem(id: string, data: UpdateCartItemData): Promise<ApiResponse<CartItem>> {
    try {
      const { data: cartItem, error } = await supabase
        .from('cart')
        .update({
          quantity: data.quantity,
        })
        .eq('id', id)
        .select(`
          *,
          product:products (*)
        `)
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
        data: cartItem as CartItem,
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
   * Remove item from cart
   */
  static async removeFromCart(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', id);

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
        data: null,
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
   * Clear entire cart for current user
   */
  static async clearCart(): Promise<ApiResponse<null>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: {
            message: 'No authenticated user',
            status: 401,
          },
        };
      }

      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: 500,
          },
        };
      }

      return {
        data: null,
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
   * Get cart item count for current user
   */
  static async getCartItemCount(): Promise<ApiResponse<number>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: 0,
          error: null,
        };
      }

      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        return {
          data: 0,
          error: {
            message: error.message,
            status: 500,
          },
        };
      }

      return {
        data: count || 0,
        error: null,
      };
    } catch {
      return {
        data: 0,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }
}