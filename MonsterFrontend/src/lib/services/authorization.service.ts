import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types/api-types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuditLogger } from './audit.service';

// Extend User type for admin-specific properties
export interface AdminUserProfile extends User {
  user_type: UserRole;
  is_active: boolean;
  is_verified: boolean;
  admin_role?: 'super_admin' | 'admin' | 'moderator';
  permissions?: AdminPermission[];
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Admin permission levels
export type AdminPermission = 
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'products:view'
  | 'orders:view'
  | 'orders:update'
  | 'orders:cancel'
  | 'users:view'
  | 'users:update'
  | 'users:deactivate'
  | 'users:promote'
  | 'inventory:view'
  | 'inventory:update'
  | 'inventory:bulk_update'
  | 'discounts:view'
  | 'discounts:create'
  | 'discounts:update'
  | 'discounts:delete'
  | 'pricing:view'
  | 'pricing:update'
  | 'analytics:view'
  | 'system:admin_promotion';

export interface AdminUser extends AdminUserProfile {
  admin_role?: 'super_admin' | 'admin' | 'moderator';
  permissions?: AdminPermission[];
}

export class AuthorizationService {
  // Session management constants
  private static readonly SESSION_START_KEY = 'admin_session_start';
  private static readonly SESSION_TIMEOUT_KEY = 'admin_session_timeout';

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get current admin user with profile
   */
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching admin profile:', error);
        return null;
      }

      // Only admin users can access admin functions
      if (profile.user_type !== 'admin') {
        return null;
      }

      return profile as AdminUser;
    } catch (error) {
      console.error('Error getting current admin:', error);
      return null;
    }
  }

  /**
   * Require admin access - throws error if not admin
   */
  static async requireAdmin(): Promise<AdminUser> {
    const admin = await this.getCurrentAdmin();
    if (!admin) {
      throw new AuthorizationError('Admin access required. Please log in as an admin user.');
    }
    return admin;
  }

  /**
   * Require specific permission
   */
  static async requirePermission(permission: AdminPermission): Promise<AdminUser> {
    const admin = await this.requireAdmin();
    
    // Super admin has all permissions
    if (admin.admin_role === 'super_admin') {
      return admin;
    }

    // Check specific permissions
    if (!admin.permissions || !admin.permissions.includes(permission)) {
      // Check default permissions based on role
      const hasDefaultPermission = this.hasDefaultPermission(admin.admin_role || 'admin', permission);
      if (!hasDefaultPermission) {
        throw new ForbiddenError(`Permission denied. Required: ${permission}`);
      }
    }

    return admin;
  }

  /**
   * Check if user has permission without throwing
   */
  static async hasPermission(permission: AdminPermission): Promise<boolean> {
    try {
      await this.requirePermission(permission);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get default permissions for admin role
   */
  private static hasDefaultPermission(role: string, permission: AdminPermission): boolean {
    const permissionMap: Record<string, AdminPermission[]> = {
      super_admin: [
        // All permissions
        'products:create', 'products:update', 'products:delete', 'products:view',
        'orders:view', 'orders:update', 'orders:cancel',
        'users:view', 'users:update', 'users:deactivate', 'users:promote',
        'inventory:view', 'inventory:update', 'inventory:bulk_update',
        'discounts:create', 'discounts:update', 'discounts:delete',
        'pricing:view', 'pricing:update',
        'analytics:view',
        'system:admin_promotion'
      ],
      admin: [
        // Most operational permissions but no system admin functions
        'products:create', 'products:update', 'products:delete', 'products:view',
        'orders:view', 'orders:update', 'orders:cancel',
        'users:view', 'users:update', 'users:deactivate',
        'inventory:view', 'inventory:update', 'inventory:bulk_update',
        'discounts:create', 'discounts:update', 'discounts:delete',
        'pricing:view', 'pricing:update',
        'analytics:view'
      ],
      moderator: [
        // Limited permissions for day-to-day operations
        'products:view', 'products:update',
        'orders:view', 'orders:update',
        'users:view', 'users:update',
        'inventory:view', 'inventory:update',
        'analytics:view'
      ]
    };

    const rolePermissions = permissionMap[role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Initialize admin session tracking
   */
  static initializeSession(): void {
    const sessionStart = Date.now();
    localStorage.setItem(this.SESSION_START_KEY, sessionStart.toString());
    localStorage.setItem(this.SESSION_TIMEOUT_KEY, (60 * 60 * 1000).toString()); // Default 1 hour
  }

  /**
   * Update session activity timestamp
   */
  static updateSessionActivity(): void {
    localStorage.setItem(this.SESSION_START_KEY, Date.now().toString());
  }

  /**
   * Require admin confirmation for critical operations
   */
  static async requireAdminConfirmation(
    operation: string,
    resource: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const admin = await this.requireAdmin();
    
    // Log critical operation attempt
    await AuditLogger.log(admin, `ADMIN_CONFIRMATION_REQUIRED`, resource, undefined, {
      operation,
      details,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, this would trigger a confirmation dialog
    // For now, we'll just log the requirement
    console.warn(`Admin confirmation required for ${operation} on ${resource}`);
  }

  /**
   * Check if admin session is still valid (session timeout)
   */
  static async validateAdminSession(timeoutMinutes: number = 60): Promise<boolean> {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) return false;
      
      // Check if admin is active
      if (!admin.is_active) {
        await AuditLogger.log(admin, 'ADMIN_SESSION_INVALID', 'auth', admin.id, {
          reason: 'Account deactivated'
        }, false);
        return false;
      }
      
      // Get session start time
      const sessionStartStr = localStorage.getItem(this.SESSION_START_KEY);
      if (!sessionStartStr) {
        // Initialize session if not found
        this.initializeSession();
        return true;
      }
      
      const sessionStart = parseInt(sessionStartStr, 10);
      const now = Date.now();
      const timeoutMs = timeoutMinutes * 60 * 1000;
      
      // Check if session has timed out
      if (now - sessionStart > timeoutMs) {
        await AuditLogger.log(admin, 'ADMIN_SESSION_TIMEOUT', 'auth', admin.id, {
          sessionStart: new Date(sessionStart).toISOString(),
          timeoutMinutes,
          reason: 'Session timeout'
        }, false);
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check rate limiting for admin operations
   */
  static async checkRateLimit(operation: string, limit: number = 10): Promise<boolean> {
    try {
      const admin = await this.getCurrentAdmin();
      if (!admin) return false;
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // Use proper Supabase count query
      const { count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: false })
        .eq('admin_id', admin.id)
        .eq('action', operation)
        .gte('timestamp', oneHourAgo);
      
      if (error) {
        console.error('Error checking rate limit:', error);
        return true; // Allow operation if check fails
      }
      
      const currentCount = count || 0;
      
      if (currentCount >= limit) {
        await AuditLogger.log(admin, 'RATE_LIMIT_EXCEEDED', 'security', admin.id, {
          operation,
          currentCount,
          limit
        }, false);
        return false;
      }
      
      return true;
    } catch {
      return true; // Allow operation if check fails
    }
  }

  /**
   * Require super admin for system-critical operations
   */
  static async requireSuperAdmin(): Promise<AdminUser> {
    const admin = await this.requireAdmin();
    
    if (admin.admin_role !== 'super_admin') {
      await AuditLogger.log(admin, 'SUPER_ADMIN_REQUIRED', 'auth', admin.id, {
        required_role: 'super_admin',
        current_role: admin.admin_role
      }, false);
      
      throw new ForbiddenError('Super Admin access required for this operation');
    }
    
    return admin;
  }

  /**
   * Log authorization attempt for security monitoring
   */
  static async logAuthorizationAttempt(
    permission: AdminPermission,
    success: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const admin = await this.getCurrentAdmin();
      
      await supabase.from('authorization_logs').insert({
        admin_id: admin?.id || null,
        permission_requested: permission,
        success,
        details: details || {},
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log authorization attempt:', error);
    }
  }

  /**
   * Get client IP address (for logging)
   */
  private static async getClientIP(): Promise<string> {
    try {
      // In a real application, this would come from the server
      // For client-side, we'll use a placeholder or try to get from headers
      return 'client-side';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Clear admin session (for logout)
   */
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_START_KEY);
    localStorage.removeItem(this.SESSION_TIMEOUT_KEY);
  }
}