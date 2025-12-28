// Base API Client
// Abstract base class for all API clients

import { RateLimiter } from './rate-limiter';
import type {
  ExternalProduct,
  FetchOptions,
  RequestOptions,
  APIResponse,
  APIError,
  RetryConfig,
  RateLimitConfig
} from '../../../types/api-integration-types';

export abstract class BaseAPIClient {
  protected config: Record<string, unknown>;
  protected baseUrl: string;
  protected rateLimiter: RateLimiter;
  protected retryConfig: RetryConfig;
  
  constructor(
    baseUrl: string,
    config: Record<string, unknown> = {},
    rateLimitConfig?: RateLimitConfig,
    retryConfig?: RetryConfig
  ) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.rateLimiter = new RateLimiter(rateLimitConfig || this.getDefaultRateLimitConfig());
    this.retryConfig = retryConfig || this.getDefaultRetryConfig();
  }

  /**
   * Fetch all products with optional filters
   */
  abstract fetchProducts(options?: FetchOptions): Promise<APIResponse<ExternalProduct[]>>;

  /**
   * Fetch a single product by ID
   */
  abstract fetchProduct(id: string | number): Promise<APIResponse<ExternalProduct>>;

  /**
   * Test the API connection
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get available categories
   */
  abstract getCategories(): Promise<APIResponse<string[]>>;

  /**
   * Get provider-specific rate limit configuration
   */
  protected getDefaultRateLimitConfig(): RateLimitConfig {
    return {
      requests_per_second: 10,
      burst_limit: 100,
      daily_limit: undefined
    };
  }

  /**
   * Get provider-specific retry configuration
   */
  protected getDefaultRetryConfig(): RetryConfig {
    return {
      max_retries: 3,
      initial_delay_ms: 1000,
      max_delay_ms: 30000,
      backoff_multiplier: 2,
      retryable_errors: [
        'ETIMEDOUT',
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'RATE_LIMITED',
        'SERVICE_UNAVAILABLE',
        'INTERNAL_SERVER_ERROR'
      ],
      exponential_backoff: true
    };
  }

  /**
   * Make a HTTP request with rate limiting and retry logic
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const maxAttempts = options.retry_count || this.retryConfig.max_retries;
    let lastError: Error | undefined;

    let attempt = 1;
    for (; attempt <= maxAttempts; attempt++) {
      try {
        // Wait for rate limit
        await this.rateLimiter.acquire();

        const response = await this.performRequest<T>(endpoint, options);
        
        if (response.error) {
          // Handle rate limiting
          if (response.error.code === 'RATE_LIMITED' && attempt < maxAttempts) {
            const delay = this.calculateRetryDelay(attempt);
            await this.delay(delay);
            continue;
          }
          
          // Handle other retryable errors
          if (this.isRetryableError(response.error) && attempt < maxAttempts) {
            const delay = this.calculateRetryDelay(attempt);
            await this.delay(delay);
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts && this.isRetryableNetworkError(error as Error)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.delay(delay);
          continue;
        }
        
        break;
      }
    }

    return {
      data: null as unknown as T,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after retries',
        details: { attempt, maxAttempts: maxAttempts }
      }
    };
  }

  /**
   * Perform the actual HTTP request
   */
  protected abstract performRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<APIResponse<T>>;

  /**
   * Check if an error is retryable
   */
  protected isRetryableError(error: APIError): boolean {
    return this.retryConfig.retryable_errors.includes(error.code.toUpperCase());
  }

  /**
   * Check if a network error is retryable
   */
  protected isRetryableNetworkError(error: Error): boolean {
    const networkRetryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET', 
      'ENOTFOUND',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'TIMEOUT'
    ];
    
    return networkRetryableErrors.some(retryableError => 
      error.message.toUpperCase().includes(retryableError)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  protected calculateRetryDelay(attempt: number): number {
    if (this.retryConfig.exponential_backoff) {
      const delay = this.retryConfig.initial_delay_ms * 
        Math.pow(this.retryConfig.backoff_multiplier, attempt - 1);
      return Math.min(delay, this.retryConfig.max_delay_ms);
    }
    
    return this.retryConfig.initial_delay_ms;
  }

  /**
   * Utility method for delays
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build URL with query parameters
   */
  protected buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Get headers for the request
   */
  protected getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MonsterMen90-API-Integration/1.0'
    };

    return { ...defaultHeaders, ...customHeaders };
  }

  /**
   * Validate required configuration
   */
  protected validateConfig(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Parse and normalize API response
   */
  protected parseResponse<T>(response: unknown): APIResponse<T> {
    // Handle different response formats
    if (response && typeof response === 'object') {
      const data = (response as Record<string, unknown>).data || response;
      return {
        data: data as T,
        meta: this.extractMeta(response as Record<string, unknown>)
      };
    }
    
    return {
      data: response as T
    };
  }

  /**
   * Extract metadata from response
   */
  protected extractMeta(response: Record<string, unknown>): APIResponse<unknown>['meta'] {
    return {
      total: response.total as number,
      page: response.page as number,
      limit: response.limit as number,
      has_more: response.has_more as boolean
    };
  }
}