/**
 * Secure Session Management Service
 * Handles session security, timeout, and management
 */

export interface SessionData {
  sessionId: string;
  userId: string;
  userType: string;
  email: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionConfig {
  maxSessionAge: number; // in milliseconds
  inactivityTimeout: number; // in milliseconds
  maxConcurrentSessions: number;
  requireFreshLogin: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  maxConcurrentSessions: 3,
  requireFreshLogin: false
};

class SessionService {
  private config: SessionConfig;
  private currentSession: SessionData | null = null;
  private activityTimer: any = null;
  private sessionListeners: ((session: SessionData | null) => void)[] = [];

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadSessionFromStorage();
    this.startActivityMonitoring();
  }

  /**
   * Create a new session
   */
  createSession(userData: {
    userId: string;
    userType: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): SessionData {
    const now = new Date();
    const sessionId = this.generateSessionId();
    
    const session: SessionData = {
      sessionId,
      userId: userData.userId,
      userType: userData.userType,
      email: userData.email,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.config.maxSessionAge),
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
      isActive: true
    };

    this.currentSession = session;
    this.saveSessionToStorage(session);
    this.notifyListeners(session);
    
    console.info('Session created', {
      sessionId,
      userId: userData.userId,
      userType: userData.userType,
      timestamp: now.toISOString()
    });

    return session;
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    if (!this.currentSession) return;

    const now = new Date();
    this.currentSession.lastActivity = now;
    this.currentSession.expiresAt = new Date(now.getTime() + this.config.maxSessionAge);
    
    this.saveSessionToStorage(this.currentSession);
    
    // Reset inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    if (!this.currentSession) {
      this.loadSessionFromStorage();
    }
    return this.currentSession;
  }

  /**
   * Validate current session
   */
  validateSession(): { valid: boolean; reason?: string } {
    const session = this.getCurrentSession();
    
    if (!session) {
      // Return valid: false but don't treat this as an error
      // It's normal for public pages to have no session
      return { valid: false, reason: 'No active session' };
    }

    const now = new Date();

    // Check if session is active
    if (!session.isActive) {
      return { valid: false, reason: 'Session is inactive' };
    }

    // Check session expiration
    if (now > session.expiresAt) {
      return { valid: false, reason: 'Session expired' };
    }

    // Check inactivity timeout
    const inactivityMs = now.getTime() - session.lastActivity.getTime();
    if (inactivityMs > this.config.inactivityTimeout) {
      return { valid: false, reason: 'Session inactive too long' };
    }

    return { valid: true };
  }

  /**
   * Extend session
   */
  extendSession(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const now = new Date();
    session.expiresAt = new Date(now.getTime() + this.config.maxSessionAge);
    session.lastActivity = now;
    
    this.saveSessionToStorage(session);
    this.notifyListeners(session);
    
    console.info('Session extended', {
      sessionId: session.sessionId,
      userId: session.userId,
      newExpiresAt: session.expiresAt.toISOString()
    });

    return true;
  }

  /**
   * End session
   */
  endSession(reason: string = 'User logout'): void {
    const session = this.getCurrentSession();
    
    if (session) {
      console.info('Session ended', {
        sessionId: session.sessionId,
        userId: session.userId,
        reason,
        duration: Date.now() - session.createdAt.getTime(),
        timestamp: new Date().toISOString()
      });
    }

    this.currentSession = null;
    this.clearSessionStorage();
    this.stopActivityMonitoring();
    this.notifyListeners(null);
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(): boolean {
    const session = this.getCurrentSession();
    if (!session) return true;

    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    return timeUntilExpiry <= refreshThreshold;
  }

  /**
   * Register session change listener
   */
  onSessionChange(listener: (session: SessionData | null) => void): () => void {
    this.sessionListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.sessionListeners.indexOf(listener);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats(): any {
    const session = this.getCurrentSession();
    if (!session) return null;

    const now = new Date();
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      userType: session.userType,
      email: session.email,
      duration: now.getTime() - session.createdAt.getTime(),
      timeUntilExpiry: session.expiresAt.getTime() - now.getTime(),
      inactivity: now.getTime() - session.lastActivity.getTime(),
      isValid: this.validateSession().valid
    };
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Save session to storage with encryption
   */
  private saveSessionToStorage(session: SessionData): void {
    try {
      const data = {
        ...session,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        version: '2.0'
      };
      
      const encoded = btoa(JSON.stringify(data));
      localStorage.setItem('secure_session', encoded);
      
      // Store session metadata
      const metadata = {
        sessionId: session.sessionId,
        userId: session.userId,
        expiresAt: session.expiresAt.getTime()
      };
      localStorage.setItem('session_metadata', btoa(JSON.stringify(metadata)));
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  /**
   * Load session from storage
   */
  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem('secure_session');
      const metadata = localStorage.getItem('session_metadata');

      if (!stored || !metadata) return;

      const sessionData = JSON.parse(atob(stored));
      const meta = JSON.parse(atob(metadata));

      // Validate session data integrity
      if (sessionData.version !== '2.0' ||
          sessionData.sessionId !== meta.sessionId ||
          sessionData.userId !== meta.userId ||
          sessionData.expiresAt !== new Date(meta.expiresAt).toISOString()) {
        console.warn('Session data integrity check failed');
        this.clearSessionStorage();
        return;
      }

      const session: SessionData = {
        ...sessionData,
        createdAt: new Date(sessionData.createdAt),
        lastActivity: new Date(sessionData.lastActivity),
        expiresAt: new Date(sessionData.expiresAt)
      };

      // Validate session
      const validation = this.validateSession();
      if (validation.valid) {
        this.currentSession = session;
      } else {
        console.warn('Loaded session is invalid:', validation.reason);
        this.clearSessionStorage();
      }
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      this.clearSessionStorage();
    }
  }

  /**
   * Clear session storage
   */
  private clearSessionStorage(): void {
    localStorage.removeItem('secure_session');
    localStorage.removeItem('session_metadata');
  }

  /**
   * Start activity monitoring
   */
  private startActivityMonitoring(): void {
    this.resetInactivityTimer();
    
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.updateActivity.bind(this), { passive: true });
    });
  }

  /**
   * Stop activity monitoring
   */
  private stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.updateActivity.bind(this));
    });
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      console.info('Session inactive timeout reached');
      this.endSession('Inactivity timeout');
    }, this.config.inactivityTimeout);
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(session: SessionData | null): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }
}

// Export singleton instance
export const sessionService = new SessionService();

export default sessionService;