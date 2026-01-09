// Base API Client
// Abstract base class for all API clients

import { RateLimiter } from './rate-limiter.js';

export class BaseAPIClient {
  constructor(baseUrl, config = {}, rateLimitConfig, retryConfig) {
    this.baseUrl = baseUrl;
    this.config = config;
    this.rateLimiter = new RateLimiter(rateLimitConfig || this.getDefaultRateLimitConfig());
    this.retryConfig = retryConfig || this.getDefaultRetryConfig();
  }

  /**
   * Fetch all products with optional filters
   */
  async fetchProducts(options) {
    throw new Error('fetchProducts must be implemented by subclass');
  }

  /**
   * Fetch a single product by ID
   */
  async fetchProduct(id) {
    throw new Error('fetchProduct must be implemented by subclass');
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    throw new Error('testConnection must be implemented by subclass');
  }

  /**
   * Get available categories
   */
  async getCategories() {
    throw new Error('getCategories must be implemented by subclass');
  }

  /**
   * Get provider-specific rate limit configuration
   */
  getDefaultRateLimitConfig() {
    return {
      requests_per_second: 10,
      burst_limit: 100,
      daily_limit: undefined
    };
  }

  /**
   * Get provider-specific retry configuration
   */
  getDefaultRetryConfig() {
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
  async makeRequest(endpoint, options = {}) {
    const maxAttempts = options.retry_count || this.retryConfig.max_retries;
    let lastError;

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
        lastError = error;

        if (attempt < maxAttempts && this.isRetryableNetworkError(error)) {
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
        details: { attempt, maxAttempts: maxAttempts }
      }
    };
  }

  /**
   * Perform the actual HTTP request
   */
  async performRequest(endpoint, options) {
    throw new Error('performRequest must be implemented by subclass');
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    return this.retryConfig.retryable_errors.includes(error.code?.toUpperCase());
  }

  /**
   * Check if a network error is retryable
   */
  isRetryableNetworkError(error) {
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
  calculateRetryDelay(attempt) {
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
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint, params) {
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
  getHeaders(customHeaders) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'MonsterMen90-API-Integration/1.0'
    };

    return { ...defaultHeaders, ...customHeaders };
  }

  /**
   * Validate required configuration
   */
  validateConfig(requiredFields) {
    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Parse and normalize API response
   */
  parseResponse(response) {
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
  extractMeta(response) {
    return {
      total: response.total,
      page: response.page,
      limit: response.limit,
      has_more: response.has_more
    };
  }
}