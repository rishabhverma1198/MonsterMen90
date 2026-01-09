import { supabase } from '../supabase';
import type {
  SignInData,
  SignUpData,
  AuthResponse,
  User,
  ApiResponse
} from '../../types/api-types';


/**
 * Enhanced Authentication Service
 * Handles user authentication operations with Supabase
 */
export class AuthService {

  /**
   * Sign in with email and password
   */
  static async signIn(data: SignInData): Promise<AuthResponse> {
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: {
          message: 'Database not configured. Please set up Supabase environment variables.',
          status: 503,
        },
      };
    }
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status,
          },
        };
      }

      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return {
          user: null,
          session: authData.session,
          error: {
            message: 'Failed to fetch user profile',
            status: 500,
          },
        };
      }

      return {
        user: userProfile as User,
        session: authData.session,
        error: null,
      };
    } catch {
      return {
        user: null,
        session: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: {
          message: 'Database not configured. Please set up Supabase environment variables.',
          status: 503,
        },
      };
    }
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status,
          },
        };
      }

      // Create user profile in users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role || 'buyer',
          });

        if (profileError) {
          return {
            user: null,
            session: authData.session,
            error: {
              message: 'Failed to create user profile',
              status: 500,
            },
          };
        }
      }

      return {
        user: authData.user ? {
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name || null,
          role: data.role || 'buyer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null,
        session: authData.session,
        error: null,
      };
    } catch {
      return {
        user: null,
        session: null,
        error: {
          message: 'An unexpected error occurred',
          status: 500,
        },
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<ApiResponse<null>> {
    if (!supabase) {
      return {
        data: null,
        error: {
          message: 'Database not configured. Please set up Supabase environment variables.',
          status: 503,
        },
      };
    }
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          data: null,
          error: {
            message: error.message,
            status: error.status,
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
   * Get current user
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    if (!supabase) {
      return {
        data: null,
        error: {
          message: 'Database not configured. Please set up Supabase environment variables.',
          status: 503,
        },
      };
    }
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

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return {
          data: null,
          error: {
            message: 'Failed to fetch user profile',
            status: 500,
          },
        };
      }

      return {
        data: userProfile as User,
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
}