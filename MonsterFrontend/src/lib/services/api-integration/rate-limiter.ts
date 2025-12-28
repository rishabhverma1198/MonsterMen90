// Rate Limiter
// Token bucket implementation for API rate limiting

import type { RateLimitConfig } from '../../../types/api-integration-types';

export class RateLimiter {
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefillTime: number;
  private queue: Array<() => void> = [];

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.burst_limit;
    this.lastRefillTime = Date.now();
    
    // Start token refill timer
    this.startRefillTimer();
  }

  /**
   * Acquire a token for making a request
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const request = () => {
        if (this.tokens > 0) {
          this.tokens--;
          resolve();
        } else {
          // Add to queue and wait
          this.queue.push(request);
        }
      };
      
      request();
    });
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Check if requests are being rate limited
   */
  isRateLimited(): boolean {
    this.refillTokens();
    return this.tokens <= 0;
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo() {
    this.refillTokens();
    return {
      tokens_available: this.tokens,
      tokens_total: this.config.burst_limit,
      requests_per_second: this.config.requests_per_second,
      daily_limit: this.config.daily_limit,
      daily_used: this.getDailyUsage()
    };
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.tokens = this.config.burst_limit;
    this.lastRefillTime = Date.now();
    this.queue = [];
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    
    if (timePassed >= 1000) { // Only refill every second
      const tokensToAdd = Math.floor(timePassed / 1000) * this.config.requests_per_second;
      this.tokens = Math.min(this.tokens + tokensToAdd, this.config.burst_limit);
      this.lastRefillTime = now;
      
      // Process queued requests
      this.processQueue();
    }
  }

  /**
   * Process queued requests when tokens become available
   */
  private processQueue(): void {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      const request = this.queue.shift();
      if (request) {
        request();
      }
    }
  }

  /**
   * Start the token refill timer
   */
  private startRefillTimer(): void {
    setInterval(() => {
      this.refillTokens();
    }, 1000); // Check every second
  }

  /**
   * Track daily usage (mock implementation - would need persistence in real app)
   */
  private getDailyUsage(): number {
    // In a real implementation, this would track daily usage
    // For now, return 0 as a placeholder
    return 0;
  }

  /**
   * Check if daily limit would be exceeded
   */
  wouldExceedDailyLimit(additionalRequests: number = 1): boolean {
    if (!this.config.daily_limit) {
      return false;
    }
    
    const currentUsage = this.getDailyUsage();
    return currentUsage + additionalRequests > this.config.daily_limit;
  }

  /**
   * Wait for a specific number of tokens to become available
   */
  async waitForTokens(count: number): Promise<void> {
    let acquired = 0;
    
    while (acquired < count) {
      await this.acquire();
      acquired++;
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  /**
   * Batch execute functions with rate limiting
   */
  async batchExecute<T>(fns: Array<() => Promise<T>>, maxConcurrent: number = 5): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<T>[] = [];
    
    for (const fn of fns) {
      const promise = this.execute(fn);
      executing.push(promise);
      
      if (executing.length >= maxConcurrent) {
        const result = await Promise.race(executing);
        results.push(result);
        const index = executing.findIndex(p => p === result);
        if (index > -1) {
          executing.splice(index, 1);
        }
      }
    }
    
    // Wait for remaining promises
    const remainingResults = await Promise.all(executing);
    return [...results, ...remainingResults];
  }

  /**
   * Get wait time until next token is available
   */
  getWaitTime(): number {
    this.refillTokens();
    if (this.tokens > 0) {
      return 0;
    }
    
    // Calculate time until next refill
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;
    return Math.max(0, 1000 - timeSinceLastRefill);
  }
}