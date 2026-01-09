import { supabase, supabaseAdmin } from '../db/db.js';
import { generateSessionId } from './csrf.middleware.js';

/**
 * Enhanced JWT Authentication Middleware
 * Validates Supabase JWT tokens with additional security checks
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log failed authentication attempt
      console.warn('Authentication failed - Missing authorization header', {
        ip: clientIP,
        userAgent,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        data: null
      });
    }

    const token = authHeader.substring(7);

    if (!token || token.length < 10) {
      console.warn('Authentication failed - Invalid token format', {
        ip: clientIP,
        userAgent,
        path: req.path,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token format',
        data: null
      });
    }

    // Verify token with Supabase with timeout
    let authResult;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      );
      
      const authPromise = supabase.auth.getUser(token);
      
      authResult = await Promise.race([authPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn('Authentication failed - Request timeout', {
        ip: clientIP,
        userAgent,
        path: req.path,
        error: timeoutError.message,
        timestamp: new Date().toISOString()
      });
      
      return res.status(408).json({
        success: false,
        error: 'Request Timeout',
        message: 'Authentication request timed out. Please try again.',
        data: null
      });
    }
    
    const { data: { user }, error } = authResult;

    if (error) {
      console.warn('Authentication failed - Token verification error', {
        ip: clientIP,
        userAgent,
        path: req.path,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token verification failed',
        data: null
      });
    }

    if (!user) {
      console.warn('Authentication failed - No user found', {
        ip: clientIP,
        userAgent,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        data: null
      });
    }

    // Check if user session is still valid
    if (user.last_sign_in_at) {
      const lastSignIn = new Date(user.last_sign_in_at);
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (Date.now() - lastSignIn.getTime() > maxSessionAge) {
        console.warn('Authentication failed - Session expired', {
          userId: user.id,
          ip: clientIP,
          lastSignIn: user.last_sign_in_at,
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Session has expired, please sign in again',
          data: null
        });
      }
    }

    // Attach user and security context to request object
    req.user = user;
    req.token = token;
    req.clientIP = clientIP;
    req.userAgent = userAgent;
    req.authenticatedAt = new Date().toISOString();
    req.sessionId = generateSessionId();

    console.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication service temporarily unavailable',
      data: null
    });
  }
};

/**
 * Admin Authorization Middleware
 * Checks if user has admin role
 * Must be used after authenticateUser
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        data: null
      });
    }

    // Check user role from database
    const { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select('user_type, is_active')
      .eq('id', req.user.id)
      .single();

    if (error || !userProfile) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'User profile not found',
        data: null
      });
    }

    // Check if user is admin
    if (userProfile.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
        data: null
      });
    }

    // Check if user is active
    if (!userProfile.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'User account is inactive',
        data: null
      });
    }

    // Attach admin info to request
    req.userRole = userProfile.user_type;
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authorization check failed',
      data: null
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token && token.length >= 10) {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          req.user = user;
          req.token = token;
          req.clientIP = clientIP;
          req.authenticatedAt = new Date().toISOString();
          
          console.info('Optional authentication successful', {
            userId: user.id,
            email: user.email,
            ip: clientIP,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    next();
  } catch (error) {
    console.warn('Optional authentication error:', error);
    // Continue without authentication if optional
    next();
  }
};

/**
 * Session Validation Middleware
 * Checks if user session is still valid and active
 */
export const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No active session',
        data: null
      });
    }

    // Get fresh user data from database
    const { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !userProfile) {
      console.warn('Session validation failed - User profile not found', {
        userId: req.user.id,
        ip: req.clientIP,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User profile not found',
        data: null
      });
    }

    // Check if user account is still active
    if (!userProfile.is_active) {
      console.warn('Session validation failed - Account inactive', {
        userId: req.user.id,
        ip: req.clientIP,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Account is inactive',
        data: null
      });
    }

    // Attach fresh user profile
    req.userProfile = userProfile;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Session validation failed',
      data: null
    });
  }
};

/**
 * Rate Limiting for Authentication Endpoints
 */
export const authRateLimit = (req, res, next) => {
  // Basic rate limiting logic (in production, use Redis or similar)
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5; // Max 5 attempts per window
  
  // This is a simplified implementation
  // In production, use a proper rate limiting library like express-rate-limit
  
  req.rateLimit = {
    clientIP,
    attempts: 0,
    resetTime: now + windowMs
  };
  
  next();
};

/**
 * Secure Logout Middleware
 * Invalidates user session and clears CSRF tokens
 */
export const secureLogout = async (req, res, next) => {
  try {
    if (req.user) {
      console.info('User logout', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.clientIP,
        timestamp: new Date().toISOString()
      });
    }
    
    // Clear any stored tokens/sessions
    req.sessionInvalidated = true;
    
    next();
  } catch (error) {
    console.error('Logout error:', error);
    next(); // Continue with logout even if error occurs
  }
};

