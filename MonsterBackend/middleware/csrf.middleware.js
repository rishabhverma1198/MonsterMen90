/**
 * CSRF Protection Middleware for Express
 * Validates CSRF tokens to prevent cross-site request forgery attacks
 */

import crypto from 'crypto';

class CSRFStore {
  constructor() {
    this.tokens = new Map();
    this.sessionTokens = new Map();
  }

  setToken(tokenData) {
    this.tokens.set(tokenData.token, tokenData);
    this.sessionTokens.set(tokenData.sessionId, tokenData.token);
    
    // Clean up expired tokens
    this.cleanupExpired();
  }

  getToken(token) {
    this.cleanupExpired();
    return this.tokens.get(token) || null;
  }

  getSessionToken(sessionId) {
    this.cleanupExpired();
    return this.sessionTokens.get(sessionId) || null;
  }

  validateToken(token, sessionId) {
    const tokenData = this.getToken(token);
    if (!tokenData) return false;

    // Check expiration
    if (new Date() > tokenData.expiresAt) {
      this.tokens.delete(token);
      if (sessionId) this.sessionTokens.delete(sessionId);
      return false;
    }

    // Check session match if provided
    if (sessionId && tokenData.sessionId !== sessionId) {
      return false;
    }

    return true;
  }

  removeToken(token) {
    const tokenData = this.tokens.get(token);
    if (tokenData) {
      this.tokens.delete(token);
      this.sessionTokens.delete(tokenData.sessionId);
    }
  }

  cleanupExpired() {
    const now = new Date();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
        this.sessionTokens.delete(data.sessionId);
      }
    }
  }

  clearAll() {
    this.tokens.clear();
    this.sessionTokens.clear();
  }
}

// Global CSRF store
const csrfStore = new CSRFStore();

/**
 * CSRF Protection Configuration
 */
const DEFAULT_CONFIG = {
  tokenLength: 32,
  expirationMinutes: 30,
  requireSessionValidation: true,
  excludePaths: [
    '/api/auth/signup',
    '/api/auth/signin',
    '/api/auth/refresh',
    '/health',
    '/api/health'
  ],
  headerNames: {
    token: 'x-csrf-token',
    session: 'x-session-id'
  }
};

/**
 * Generate cryptographically secure CSRF token
 */
function generateCSRFToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate session ID
 */
export function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * CSRF Protection Middleware
 */
export function csrfProtection(config = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (req, res, next) => {
    const path = req.path;
    const method = req.method;

    // Skip CSRF check for excluded paths
    if (finalConfig.excludePaths.some(excluded => path.startsWith(excluded))) {
      return next();
    }

    // Skip for GET, HEAD, OPTIONS requests (non-state-changing)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }

    const csrfToken = req.headers[finalConfig.headerNames.token];
    const sessionId = req.headers[finalConfig.headerNames.session];

    // Require CSRF token for state-changing operations
    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token missing',
        message: 'CSRF token is required for this operation',
        data: null
      });
    }

    // Validate CSRF token
    const isValid = csrfStore.validateToken(csrfToken, sessionId);
    
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token invalid',
        message: 'Invalid or expired CSRF token',
        data: null
      });
    }

    // Attach CSRF data to request for logging
    req.csrfToken = csrfToken;
    req.csrfSessionId = sessionId;

    next();
  };
}

/**
 * Generate new CSRF token for client
 */
export function generateCSRF(req, res, next) {
  const sessionId = req.headers[finalConfig.headerNames.session] || generateSessionId();
  const token = generateCSRFToken(DEFAULT_CONFIG.tokenLength);
  const expiresAt = new Date(Date.now() + DEFAULT_CONFIG.expirationMinutes * 60 * 1000);

  const tokenData = {
    token,
    sessionId,
    expiresAt,
    userId: req.user?.id
  };

  csrfStore.setToken(tokenData);

  res.setHeader('X-CSRF-Token', token);
  res.setHeader('X-Session-ID', sessionId);

  next();
}

/**
 * CSRF Token Validation for specific routes
 */
export function requireValidCSRF(req, res, next) {
  const token = req.headers[finalConfig.headerNames.token];
  const sessionId = req.headers[finalConfig.headerNames.session];

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token required',
      message: 'X-CSRF-Token header is required',
      data: null
    });
  }

  const isValid = csrfStore.validateToken(token, sessionId);
  
  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'Token validation failed',
      data: null
    });
  }

  next();
}

/**
 * Clear CSRF tokens for user/session
 */
export function clearCSRF(req, res, next) {
  const token = req.headers[finalConfig.headerNames.token];
  if (token) {
    csrfStore.removeToken(token);
  }
  next();
}

/**
 * Get CSRF statistics (for monitoring)
 */
export function getCSRFStats() {
  return {
    totalTokens: csrfStore.tokens.size,
    activeSessions: csrfStore.sessionTokens.size,
    config: DEFAULT_CONFIG
  };
}

/**
 * Reset CSRF store (for testing/admin)
 */
export function resetCSRFStore() {
  csrfStore.clearAll();
}

export { csrfStore };
export default csrfProtection;