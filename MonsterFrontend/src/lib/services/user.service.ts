import { supabase } from '../supabase';
import type {
  User,
  UpdateUserData,
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../../types/api-types';

/**
 * User Service
 * Handles user management operations
 */
export class UserService {

  /**
   * Get all users (Admin only)
   */
  static async getUsers(pagination?: PaginationParams): Promise<PaginatedResponse<User>> {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

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
        data: data as User[],
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
   * Get a single user by ID
   */
  static async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
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
        data: data as User,
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
   * Update user information
   */
  static async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    try {
      const { data: user, error } = await supabase
        .from('users')
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
        data: user as User,
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
   * Block/unblock a user (Admin only)
   * Note: Since there's no 'blocked' field in the schema, this implementation
   * assumes the schema will be updated to include a 'is_blocked' boolean field.
   * For now, this is a placeholder that returns an error.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async toggleUserBlock(_id: string, _block: boolean): Promise<ApiResponse<User>> {
    try {
      // TODO: Update schema to include 'is_blocked' boolean field
      // For now, return error indicating schema needs update
      return {
        data: null,
        error: {
          message: 'User blocking not implemented - schema needs is_blocked field',
          status: 501, // Not Implemented
        },
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
   * Block a user (Admin only)
   */
  static async blockUser(id: string): Promise<ApiResponse<User>> {
    return this.toggleUserBlock(id, true);
  }

  /**
   * Unblock a user (Admin only)
   */
  static async unblockUser(id: string): Promise<ApiResponse<User>> {
    return this.toggleUserBlock(id, false);
  }

  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<ApiResponse<User>> {
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

      return this.getUser(user.id);
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
   * Update current user's profile
   */
  static async updateCurrentUserProfile(data: UpdateUserData): Promise<ApiResponse<User>> {
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

      return this.updateUser(user.id, data);
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
}