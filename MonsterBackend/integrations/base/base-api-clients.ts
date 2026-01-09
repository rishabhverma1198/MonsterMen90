// Base API Client
// Abstract base class for all API clients

import { RateLimiter, RateLimitConfig } from './rate-limiter';

export interface APIConfig {
  [key: string]: any;
}

export interface RetryConfig {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retryable_errors: string[];
  exponential_backoff: boolean;
}

export interface APIResponse<T = any> {
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
  };
}

export abstract class BaseAPIClient {
  protected baseUrl: string;
  protected config: APIConfig;
  protected rateLimiter: RateLimiter;
  protected retryConfig: RetryConfig;

  constructor(baseUrl: string, config: APIConfig = {}, rateLimitConfig?: RateLimitConfig, retryConfig?: RetryConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.rateLimiter = new RateLimiter(rateLimitConfig || this.getDefaultRateLimitConfig());
    this.retryConfig = retryConfig || this.getDefaultRetryConfig();
  }

  /**
   * Fetch all products with optional filters
   */
  abstract fetchProducts(options?: any): Promise<APIResponse>;

  /**
   * Fetch a single product by ID
   */
  abstract fetchProduct(id: string | number): Promise<APIResponse>;

  /**
   * Test the API connection
   */
  abstract testConnection(): Promise<APIResponse>;

  /**
   * Get available categories
   */
  abstract getCategories(): Promise<APIResponse>;

  /**
   * Get provider-specific rate limit configuration
   */
  getDefaultRateLimitConfig(): RateLimitConfig {
    return {
      requests_per_second: 10,
      burst_limit: 100,
      daily_limit: undefined
    };
  }

  /**
   * Get provider-specific retry configuration
   */
  getDefaultRetryConfig(): RetryConfig {
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
  async makeRequest(endpoint: string, options: any = {}): Promise<APIResponse> {
    const maxAttempts = options.retry_count || this.retryConfig.max_retries;
    let lastError: Error | null = null;

    let attempt = 1;
    for (; attempt <= maxAttempts; attempt++) {
      try {
        // Wait for rate limit
        await this.rateLimiter.acquire();

        const response = await this.performRequest(endpoint, options);

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
      data: null,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after retries',
        details: { attempt, maxAttempts }
      }
    };
  }

  /**
   * Perform the actual HTTP request
   */
  abstract performRequest(endpoint: string, options: any): Promise<APIResponse>;

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: { code?: string }): boolean {
    return this.retryConfig.retryable_errors.includes(error.code?.toUpperCase() || '');
  }

  /**
   * Check if a network error is retryable
   */
  isRetryableNetworkError(error: Error): boolean {
    const networkRetryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'TIMEOUT'
    ];

    return networkRetryableErrors.some(retryableError =>
      error.message?.toUpperCase().includes(retryableError)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number): number {
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
  delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint: string, params?: Record<string, any>): string {
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
  getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'MonsterMen90-API-Integration/1.0'
    };

    return { ...defaultHeaders, ...customHeaders };
  }

  /**
   * Validate required configuration
   */
  validateConfig(requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Parse and normalize API response
   */
  parseResponse(response: any): APIResponse {
    // Handle different response formats
    if (response && typeof response === 'object') {
      const data = response.data || response;
      return {
        data: data,
        meta: this.extractMeta(response)
      };
    }

    return {
      data: response
    };
  }

  /**
   * Extract metadata from response
   */
  extractMeta(response: any): { total?: number; page?: number; limit?: number; has_more?: boolean } {
    return {
      total: response.total,
      page: response.page,
      limit: response.limit,
      has_more: response.has_more
    };
  }
}