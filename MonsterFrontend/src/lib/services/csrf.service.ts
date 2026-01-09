/**
 * CSRF Protection Service
 * Provides secure CSRF token generation, validation, and rotation
 */

export interface CSRFToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  sessionId: string;
}

export interface CSRFConfig {
  tokenLength: number;
  expirationMinutes: number;
  rotateOnAuth: boolean;
}

const DEFAULT_CONFIG: CSRFConfig = {
  tokenLength: 32,
  expirationMinutes: 30,
  rotateOnAuth: true
};

class CSRFService {
  private config: CSRFConfig;
  private currentToken: CSRFToken | null = null;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a cryptographically secure CSRF token
   */
  private generateToken(): string {
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a new CSRF token
   */
  generateNewToken(sessionId?: string): CSRFToken {
    const now = new Date();
    const token = this.generateToken();
    const session = sessionId || this.generateSessionId();

    const csrfToken: CSRFToken = {
      token,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.expirationMinutes * 60 * 1000),
      sessionId: session
    };

    this.currentToken = csrfToken;
    this.storeTokenSecurely(csrfToken);
    return csrfToken;
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store token securely in localStorage with encryption-like obfuscation
   */
  private storeTokenSecurely(token: CSRFToken): void {
    try {
      // Simple obfuscation (not true encryption, but better than plain text)
      const encoded = btoa(JSON.stringify(token));
      localStorage.setItem('secure_csrf_token', encoded);
      
      // Store metadata for validation
      const metadata = {
        sessionId: token.sessionId,
        expiresAt: token.expiresAt.getTime()
      };
      localStorage.setItem('csrf_metadata', btoa(JSON.stringify(metadata)));
    } catch (error) {
      console.error('Failed to store CSRF token:', error);
    }
  }

  /**
   * Retrieve and validate CSRF token
   */
  getCurrentToken(): CSRFToken | null {
    // Return cached token if valid and not expired
    if (this.currentToken && new Date() <= this.currentToken.expiresAt) {
      return this.currentToken;
    }

    try {
      const stored = localStorage.getItem('secure_csrf_token');
      const metadata = localStorage.getItem('csrf_metadata');

      if (!stored || !metadata) {
        return null;
      }

      const token: CSRFToken = JSON.parse(atob(stored));
      const meta = JSON.parse(atob(metadata));

      // Convert expiresAt string back to Date object
      token.expiresAt = new Date(token.expiresAt);
      token.createdAt = new Date(token.createdAt);

      // Validate token integrity
      if (token.sessionId !== meta.sessionId || 
          token.expiresAt.getTime() !== meta.expiresAt) {
        this.clearTokens();
        return null;
      }

      // Check expiration
      if (new Date() > token.expiresAt) {
        this.clearTokens();
        return null;
      }

      this.currentToken = token;
      return token;
    } catch (error) {
      console.error('Failed to retrieve CSRF token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Validate incoming CSRF token from request headers
   */
  validateToken(incomingToken: string): boolean {
    // Use cached token if available and valid
    if (this.currentToken && new Date() <= this.currentToken.expiresAt) {
      return this.currentToken.token === incomingToken;
    }
    
    const currentToken = this.getCurrentToken();
    
    if (!currentToken) {
      return false;
    }

    // Check token match and expiration
    return currentToken.token === incomingToken && new Date() <= currentToken.expiresAt;
  }

  /**
   * Get CSRF token for headers
   */
  getTokenForHeaders(): Record<string, string> {
    // Use cached token if available and valid
    if (this.currentToken && new Date() <= this.currentToken.expiresAt) {
      return {
        'X-CSRF-Token': this.currentToken.token,
        'X-Session-ID': this.currentToken.sessionId
      };
    }

    const token = this.getCurrentToken();
    if (!token) {
      return {};
    }

    return {
      'X-CSRF-Token': token.token,
      'X-Session-ID': token.sessionId
    };
  }

  /**
   * Clear all CSRF tokens
   */
  clearTokens(): void {
    localStorage.removeItem('secure_csrf_token');
    localStorage.removeItem('csrf_metadata');
    this.currentToken = null;
  }

  /**
   * Rotate CSRF token (generate new one)
   */
  rotateToken(): CSRFToken {
    this.clearTokens();
    return this.generateNewToken();
  }

  /**
   * Check if token needs rotation (expired or expiring soon)
   */
  needsRotation(): boolean {
    // Use cached token if available and valid
    if (this.currentToken && new Date() <= this.currentToken.expiresAt) {
      // Rotate if expiring in next 5 minutes
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return this.currentToken.expiresAt <= fiveMinutesFromNow;
    }

    const token = this.getCurrentToken();
    if (!token) return true;

    // Rotate if expiring in next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return token.expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Auto-rotate token if needed
   */
  ensureFreshToken(): CSRFToken {
    // Use cached token if available and valid
    if (this.currentToken && new Date() <= this.currentToken.expiresAt) {
      // Check if it needs rotation
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (this.currentToken.expiresAt > fiveMinutesFromNow) {
        return this.currentToken;
      }
    }

    if (this.needsRotation()) {
      return this.rotateToken();
    }
    
    return this.getCurrentToken() || this.generateNewToken();
  }
}

// Export singleton instance
export const csrfService = new CSRFService();

// Export for use in API calls
export default csrfService;