// FakeStoreAPI Client
// Implementation for FakeStoreAPI.com integration

import { BaseAPIClient } from '../base-api-client';
import type {
  ExternalProduct,
  FetchOptions,
  RequestOptions,
  APIResponse
} from '../../../../types/api-integration-types';

// FakeStoreAPI Product Type
interface FakeStoreProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  price: number;
  rating?: {
    rate: number;
    count: number;
  };
}

// Direct array response for products endpoint
type FakeStoreProductsArrayResponse = FakeStoreProduct[];



export class FakeStoreAPIClient extends BaseAPIClient {
  constructor(config: Record<string, unknown> = {}) {
    super('https://fakestoreapi.com', config);
  }

  /**
   * Fetch all products with optional filters
   */
  async fetchProducts(options?: FetchOptions): Promise<APIResponse<ExternalProduct[]>> {
    const endpoint = '/products';
    const params: Record<string, unknown> = {};
    
    if (options?.limit) {
      params.limit = options.limit;
    }
    
    if (options?.category) {
      // FakeStoreAPI doesn't support category filtering directly
      // We'll need to fetch all and filter
    }
    
    if (options?.search) {
      // FakeStoreAPI doesn't support search directly
      // We'll need to fetch all and filter
    }

    const response = await this.makeRequest<FakeStoreProductsArrayResponse>(
      this.buildUrl(endpoint, params)
    );

    if (response.error) {
      return {
        data: [],
        error: response.error
      };
    }

    // Transform FakeStoreAPI format to our ExternalProduct format
    const products = (response.data as FakeStoreProduct[]).map(this.transformProduct.bind(this));
    
    // Apply client-side filtering for search and category
    let filteredProducts = products;
    
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredProducts = products.filter((product: ExternalProduct) => {
        const categoryStr = typeof product.category === 'string' ? product.category : '';
        const title = product.title || product.name || '';
        const description = product.description || '';
        return title.toLowerCase().includes(searchTerm) ||
               description.toLowerCase().includes(searchTerm) ||
               categoryStr.toLowerCase().includes(searchTerm);
      });
    }
    
    if (options?.category) {
      filteredProducts = filteredProducts.filter((product: ExternalProduct) => {
        const categoryStr = typeof product.category === 'string' ? product.category : '';
        return categoryStr.toLowerCase() === options.category?.toLowerCase();
      });
    }

    return {
      data: filteredProducts as ExternalProduct[],
      meta: {
        total: filteredProducts.length,
        limit: options?.limit || filteredProducts.length,
        page: 1,
        has_more: false
      }
    };
  }

  /**
   * Fetch a single product by ID
   */
  async fetchProduct(id: string | number): Promise<APIResponse<ExternalProduct>> {
    const endpoint = `/products/${id}`;
    
    const response = await this.makeRequest<FakeStoreProduct>(
      endpoint
    );

    if (response.error) {
      return {
        data: null as unknown as ExternalProduct,
        error: response.error
      };
    }

    const product = this.transformProduct(response.data);
    
    return {
      data: product
    };
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchProducts({ limit: 1 });
      return !response.error;
    } catch {
      return false;
    }
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<APIResponse<string[]>> {
    const response = await this.makeRequest<string[]>('/products/categories');
    
    if (response.error) {
      return {
        data: [],
        error: response.error
      };
    }

    return {
      data: response.data
    };
  }

  /**
   * Get products by category
   */
  async fetchProductsByCategory(category: string): Promise<APIResponse<ExternalProduct[]>> {
    const endpoint = `/products/category/${category}`;
    
    const response = await this.makeRequest<FakeStoreProductsArrayResponse>(endpoint);

    if (response.error) {
      return {
        data: [],
        error: response.error
      };
    }

    const products = (response.data as FakeStoreProduct[]).map(this.transformProduct.bind(this));

    return {
      data: products as ExternalProduct[],
      meta: {
        total: products.length,
        limit: products.length,
        page: 1,
        has_more: false
      }
    };
  }

  /**
   * Transform FakeStoreAPI product to our ExternalProduct format
   */
  private transformProduct(product: FakeStoreProduct): ExternalProduct {
    return {
      id: product.id,
      title: product.title,
      name: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      images: [product.image],
      image: product.image,
      rating: product.rating?.rate,
      rate: product.rating?.rate,
      count: product.rating?.count,
      // Additional mappings
      stock: Math.floor(Math.random() * 100) + 1, // FakeStoreAPI doesn't provide stock
      inventory_quantity: Math.floor(Math.random() * 100) + 1,
      // Provider-specific data
      provider_data: {
        fake_store: {
          rating: product.rating
        }
      }
    };
  }

  /**
   * Perform the actual HTTP request
   */
  protected async performRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: this.getHeaders(options.headers),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          data: null as unknown as T,
          error: {
            code: `HTTP_${response.status}`,
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: {
              status: response.status,
              statusText: response.statusText
            }
          }
        };
      }

      const data = await response.json();
      return this.parseResponse<T>(data as T);
    } catch {
      clearTimeout(timeoutId);
      
      return {
        data: null as unknown as T,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        }
      };
    }
  }

  /**
   * Get provider-specific rate limit configuration
   */
  protected getDefaultRateLimitConfig() {
    return {
      requests_per_second: 10, // FakeStoreAPI is very generous
      burst_limit: 100,
      daily_limit: undefined // No daily limit
    };
  }

  /**
   * Get provider-specific retry configuration
   */
  protected getDefaultRetryConfig() {
    return {
      max_retries: 3,
      initial_delay_ms: 500,
      max_delay_ms: 5000,
      backoff_multiplier: 2,
      retryable_errors: [
        'NETWORK_ERROR',
        'TIMEOUT',
        'HTTP_500',
        'HTTP_502',
        'HTTP_503',
        'HTTP_504'
      ],
      exponential_backoff: true
    };
  }
}