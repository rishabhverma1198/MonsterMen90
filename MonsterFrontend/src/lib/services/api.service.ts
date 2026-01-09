/**
 * API Service with Dynamic Token Injection
 * Calls supabase.auth.getSession() before EVERY request
 * Ensures no request is sent without a valid token
 */

import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get fresh session token from Supabase before every request
   * This ensures we always have the latest token
   */
  private async getFreshToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[api.service] Session error:', error);
        return null;
      }
      
      if (!session || !session.access_token) {
        console.warn('[api.service] No active session');
        return null;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('[api.service] Error getting session:', error);
      return null;
    }
  }

  /**
   * Get headers with dynamic token injection
   * VERIFICATION: No request sent if token is undefined
   */
  private async getHeaders(): Promise<HeadersInit | null> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get fresh token before every request
    const token = await this.getFreshToken();
    
    // VERIFICATION: Return null if no token (prevents request)
    if (!token) {
      console.warn('[api.service] No token available, request will be blocked');
      return null;
    }

    headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Handle 401 errors globally
   */
  private handle401Error() {
    // Dispatch custom event for global 401 handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  /**
   * Handle API response with global error handling
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      this.handle401Error();
      return { 
        error: 'Unauthorized: Please login again',
        success: false 
      };
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      return { 
        error: 'Forbidden: Admin access required',
        success: false 
      };
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use default error message
        }
      }
      
      return { error: errorMessage, success: false };
    }

    if (response.status === 204) {
      return { success: true };
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        return { data, success: true };
      } catch (e) {
        return { error: 'Failed to parse response JSON', success: false };
      }
    }

    return { error: 'Unexpected response format', success: false };
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      // Get headers with fresh token
      const headers = await this.getHeaders();
      
      // VERIFICATION: Block request if no token
      if (!headers) {
        return { 
          error: 'Unauthorized: No authentication token available',
          success: false 
        };
      }

      const url = new URL(`${this.baseURL}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error',
        success: false 
      };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      if (!headers) {
        return { 
          error: 'Unauthorized: No authentication token available',
          success: false 
        };
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error',
        success: false 
      };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      if (!headers) {
        return { 
          error: 'Unauthorized: No authentication token available',
          success: false 
        };
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error',
        success: false 
      };
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      if (!headers) {
        return { 
          error: 'Unauthorized: No authentication token available',
          success: false 
        };
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error',
        success: false 
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      if (!headers) {
        return { 
          error: 'Unauthorized: No authentication token available',
          success: false 
        };
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Network error',
        success: false 
      };
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);
