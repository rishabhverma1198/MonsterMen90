// Rate Limiter
// Implements rate limiting for API requests

export interface RateLimitConfig {
  requests_per_second: number;
  burst_limit: number;
  daily_limit?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: number[]; // timestamps of requests in milliseconds
  private dailyRequests: number;
  private lastDailyReset: number;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.requests = []; // timestamps of requests in milliseconds
    this.dailyRequests = 0;
    this.lastDailyReset = Date.now();
  }

  /**
   * Acquire permission to make a request, waiting if necessary
   */
  async acquire(): Promise<void> {
    const now = Date.now();

    // Reset daily counter if 24 hours have passed
    if (now - this.lastDailyReset >= 24 * 60 * 60 * 1000) {
      this.dailyRequests = 0;
      this.lastDailyReset = now;
    }

    // Check daily limit
    if (this.config.daily_limit && this.dailyRequests >= this.config.daily_limit) {
      throw new Error('Daily rate limit exceeded');
    }

    // Clean up old requests outside the 1-second window
    const windowStart = now - 1000;
    this.requests = this.requests.filter(ts => ts > windowStart);

    // Check burst limit
    if (this.requests.length >= this.config.burst_limit) {
      // Wait until the oldest request in the burst window expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 1000 - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Check requests per second limit
    if (this.requests.length >= this.config.requests_per_second) {
      // Wait until the oldest request in the 1-second window expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 1000 - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record the request
    this.requests.push(now);
    this.dailyRequests++;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { requestsInLastSecond: number; dailyRequests: number; isLimited: boolean } {
    const now = Date.now();
    
    // Apply daily reset if needed
    if (now - this.lastDailyReset >= 24 * 60 * 60 * 1000) {
      this.dailyRequests = 0;
      this.lastDailyReset = now;
    }
    
    const windowStart = now - 1000;
    const recentRequests = this.requests.filter(ts => ts > windowStart).length;

    return {
      requestsInLastSecond: recentRequests,
      dailyRequests: this.dailyRequests,
      isLimited: recentRequests >= this.config.requests_per_second ||
                recentRequests >= this.config.burst_limit ||
                this.dailyRequests >= (this.config.daily_limit || Infinity)
    };
  }}