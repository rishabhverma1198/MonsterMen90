import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { AuthService } from '../lib/services/auth.service';
import { sessionService } from '../lib/services/session.service';
import { csrfService } from '../lib/services/csrf.service';
import type { User, AuthResponse, UserRole } from '../types/api-types';
import { AuthContext } from './AuthContextBase';
import type { AuthContextType } from './AuthContextBase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('[AuthContext] Provider mounting');
    isMountedRef.current = true;

    // Initialize security services (non-blocking)
    initializeSecurity();

    // Check for existing session on mount (non-blocking for public pages)
    // Don't block page rendering if there's no session
    // Use setTimeout to make it truly non-blocking
    setTimeout(() => {
      refreshUser().catch((error) => {
        // Silently handle "No active session" - this is normal for public pages
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('No active session') && !errorMessage.includes('No user data')) {
          console.warn('[AuthContext] Initial refresh failed, allowing public access:', error);
        }
        // Ensure loading is set to false even if refresh fails
        if (isMountedRef.current) {
          setLoading(false);
        }
      });
    }, 0);

    // Set up session monitoring
    const unsubscribeSession = sessionService.onSessionChange(handleSessionChange);

    return () => {
      console.log('[AuthContext] Provider unmounting');
      isMountedRef.current = false;
      unsubscribeSession();
    };
  }, []);

  /**
   * Initialize security services (non-blocking)
   */
  const initializeSecurity = () => {
    try {
      // Ensure CSRF token is available (non-blocking)
      csrfService.ensureFreshToken();
      
      // Check existing session (non-blocking)
      const currentSession = sessionService.getCurrentSession();
      if (currentSession) {
        const validation = sessionService.validateSession();
        setSessionValid(validation.valid);
        // Only set loading if we have a session to validate
        if (!validation.valid) {
          setLoading(false);
        }
      } else {
        // No session is fine for public pages - set loading to false immediately
        setSessionValid(false);
        setLoading(false); // Don't block if no session
      }
    } catch (error) {
      console.warn('[AuthContext] Security initialization error (non-blocking):', error);
      // Don't block pages if security init fails
      setSessionValid(false);
      setLoading(false);
    }
  };

  /**
   * Handle session changes from session service
   */
  const handleSessionChange = (session: any) => {
    if (!isMountedRef.current) return;
    
    setSessionValid(!!session);
    
    if (!session) {
      // Session ended, clear user
      setUser(null);
      console.log('[AuthContext] Session ended, user cleared');
    }
  };

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('[AuthContext] Sign in attempt', { email, timestamp: new Date().toISOString() });

      const response = await AuthService.signIn({ email, password });

      if (response.user && response.session) {
        // Create secure session
        const session = sessionService.createSession({
          userId: response.user.id,
          userType: response.user.user_type,
          email: response.user.email
        });

        if (isMountedRef.current) {
          setUser(response.user);
          setSessionValid(true);
        }

        console.log('[AuthContext] Sign in successful', {
          userId: response.user.id,
          email: response.user.email,
          sessionId: session.sessionId,
          timestamp: new Date().toISOString()
        });
      } else if (response.error) {
        console.warn('[AuthContext] Sign in failed', {
          email,
          error: response.error.message,
          timestamp: new Date().toISOString()
        });
      }

      return response;
    } catch (error) {
      console.error('[AuthContext] Sign in error', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return {
        user: null,
        session: null,
        error: {
          message: 'An unexpected error occurred during sign in',
          status: 500,
        },
      };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName?: string,
    user_type: UserRole = 'buyer'
  ): Promise<AuthResponse> => {
    try {
      console.log('[AuthContext] Sign up attempt', { email, user_type, timestamp: new Date().toISOString() });

      const response = await AuthService.signUp({
        email,
        password,
        full_name: fullName,
        user_type
      });

      if (response.user && response.session) {
        // Create secure session for new user
        const session = sessionService.createSession({
          userId: response.user.id,
          userType: response.user.user_type,
          email: response.user.email
        });

        if (isMountedRef.current) {
          setUser(response.user);
          setSessionValid(true);
        }

        console.log('[AuthContext] Sign up successful', {
          userId: response.user.id,
          email: response.user.email,
          user_type: response.user.user_type,
          sessionId: session.sessionId,
          timestamp: new Date().toISOString()
        });
      } else if (response.error) {
        console.warn('[AuthContext] Sign up failed', {
          email,
          user_type,
          error: response.error.message,
          timestamp: new Date().toISOString()
        });
      }

      return response;
    } catch (error) {
      console.error('[AuthContext] Sign up error', {
        email,
        user_type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return {
        user: null,
        session: null,
        error: {
          message: 'An unexpected error occurred during registration',
          status: 500,
        },
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      const currentSession = sessionService.getCurrentSession();

      console.log('[AuthContext] Sign out attempt', {
        userId: currentSession?.userId,
        sessionId: currentSession?.sessionId,
        timestamp: new Date().toISOString()
      });

      // End session first
      sessionService.endSession('User logout');

      // Then sign out from auth service
      await AuthService.signOut();

      if (isMountedRef.current) {
        setUser(null);
        setSessionValid(false);
      }

      console.log('[AuthContext] Sign out successful', {
        userId: currentSession?.userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AuthContext] Sign out error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Still clear local state even if service call fails
      setUser(null);
      setSessionValid(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    console.log('[AuthContext] refreshUser called, isMounted:', isMountedRef.current);

    try {
      // Check session validity first
      const sessionValidation = sessionService.validateSession();
      if (!sessionValidation.valid) {
        // Don't log warnings for "No active session" - this is normal for public pages
        if (sessionValidation.reason !== 'No active session') {
          console.warn('[AuthContext] Session invalid during refresh', {
            reason: sessionValidation.reason,
            timestamp: new Date().toISOString()
          });
        }

        if (isMountedRef.current) {
          setUser(null);
          setSessionValid(false);
          setLoading(false); // Set loading to false immediately for public pages
        }
        return;
      }

      // Only set loading if we have a valid session to check
      setLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth refresh timeout')), 10000)
      );

      const authPromise = AuthService.getCurrentUser();
      const response = await Promise.race([authPromise, timeoutPromise]);

      if (isMountedRef.current) {
        if (response.data) {
          setUser(response.data);
          setSessionValid(true);

          // Update session activity
          sessionService.updateActivity();

          console.log('[AuthContext] refreshUser completed successfully', {
            userId: response.data.id,
            email: response.data.email,
            timestamp: new Date().toISOString()
          });
        } else {
          // No user data, clear session
          setUser(null);
          setSessionValid(false);
          sessionService.endSession('No user data');

          console.log('[AuthContext] refreshUser - no user data found');
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      if (isMountedRef.current) {
        setUser(null);
        setSessionValid(false);

        // Clear potentially corrupted session
        sessionService.endSession('Refresh error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  
  /**
   * Check if session needs refresh
   */
  const needsSessionRefresh = useCallback((): boolean => {
    return sessionService.needsRefresh();
  }, []);

  /**
   * Extend current session
   */
  const extendSession = useCallback((): boolean => {
    return sessionService.extendSession();
  }, []);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback(() => {
    return sessionService.getSessionStats();
  }, []);
  
  /**
   * Check if user has required role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.user_type === role;
  }, [user]);

  /**
   * Check if user has any of the required roles
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.user_type) : false;
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    sessionValid,
    signIn,
    signUp,
    signOut,
    refreshUser,
    needsSessionRefresh,
    extendSession,
    getSessionStats,
    hasRole,
    hasAnyRole,
  }), [user, loading, sessionValid, signIn, signUp, signOut, refreshUser, needsSessionRefresh, extendSession, getSessionStats, hasRole, hasAnyRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
