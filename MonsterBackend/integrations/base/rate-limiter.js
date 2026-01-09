// Rate Limiter
// Implements rate limiting for API requests

export class RateLimiter {
  constructor(config) {
    this.config = config;
    this.requests = []; // timestamps of requests in milliseconds
    this.dailyRequests = 0;
    this.lastDailyReset = Date.now();
    
    // Set burst window to 1 second if not specified
    this.burstWindowMs = config.burst_window_ms || 1000;
  }

  /**
   * Acquire permission to make a request, waiting if necessary
   */
  async acquire() {
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

    // Clean up old requests outside both windows
    const oneSecondWindowStart = now - 1000;
    const burstWindowStart = now - this.burstWindowMs;
    this.requests = this.requests.filter(ts => ts >= burstWindowStart);

    let burstWaitTime = 0;
    let rpsWaitTime = 0;

    // Check burst limit with burst window
    if (this.config.burst_limit) {
      const burstWindowRequests = this.requests.filter(ts => ts >= burstWindowStart);
      if (burstWindowRequests.length >= this.config.burst_limit) {
        const oldestBurstRequest = Math.min(...burstWindowRequests);
        burstWaitTime = this.burstWindowMs - (now - oldestBurstRequest);
      }
    }

    // Check requests per second with 1-second window
    if (this.config.requests_per_second) {
      const oneSecondWindowRequests = this.requests.filter(ts => ts >= oneSecondWindowStart);
      if (oneSecondWindowRequests.length >= this.config.requests_per_second) {
        const oldestRpsRequest = Math.min(...oneSecondWindowRequests);
        rpsWaitTime = 1000 - (now - oldestRpsRequest);
      }
    }

    // Wait for the maximum of the two wait times (or 0 if neither requires waiting)
    const waitTime = Math.max(0, burstWaitTime, rpsWaitTime);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Update 'now' after waiting and clean up again
      const updatedNow = Date.now();
      const updatedBurstWindowStart = updatedNow - this.burstWindowMs;
      this.requests = this.requests.filter(ts => ts >= updatedBurstWindowStart);
    }

    // Record the request
    this.requests.push(now);
    this.dailyRequests++;
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    const now = Date.now();
    const oneSecondWindowStart = now - 1000;
    const burstWindowStart = now - this.burstWindowMs;
    
    const oneSecondRequests = this.requests.filter(ts => ts >= oneSecondWindowStart).length;
    const burstWindowRequests = this.requests.filter(ts => ts >= burstWindowStart).length;

    return {
      requestsInLastSecond: oneSecondRequests,
      requestsInBurstWindow: burstWindowRequests,
      dailyRequests: this.dailyRequests,
      burstWindowMs: this.burstWindowMs,
      isLimited: oneSecondRequests >= (this.config.requests_per_second || Infinity) ||
                burstWindowRequests >= (this.config.burst_limit || Infinity) ||
                this.dailyRequests >= (this.config.daily_limit || Infinity)
    };
  }
}