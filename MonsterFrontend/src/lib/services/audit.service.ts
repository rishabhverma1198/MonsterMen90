import { supabase } from '@/lib/supabase';
import type { AdminUser } from './authorization.service';

export interface AuditLogEntry {
  id?: string;
  admin_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string; // ✅ DB managed
  success: boolean;
  error_message?: string;
}

// Type for Supabase response with audit data
interface AuditLogResponse {
  action: string;
  success: boolean;
}

export class AuditLogger {
  /**
   * Log an admin action for audit trail
   */
  static async log(
    admin: AdminUser,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details: Record<string, unknown> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id' | 'created_at'> = {
        admin_id: admin.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: await this.getClientIP(),
        user_agent: this.getUserAgent(),
        success,
        error_message: errorMessage
      };

      const { error } = await supabase.from('audit_logs').insert(auditEntry);
      
      if (error) {
        console.error('Failed to log audit entry:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  /**
   * Log a failed admin action
   */
  static async logFailure(
    admin: AdminUser,
    action: string,
    error: Error | string,
    resourceType?: string,
    resourceId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    await this.log(admin, action, resourceType, resourceId, details, false, errorMessage);
  }

  /**
   * Log a successful admin action
   */
  static async logSuccess(
    admin: AdminUser,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.log(admin, action, resourceType, resourceId, details, true);
  }

  /**
   * Get audit logs for a specific admin
   */
  static async getAdminLogs(
    adminId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: AuditLogEntry[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching admin logs:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Failed to fetch admin logs:', error);
      return { data: null, error };
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<{ data: AuditLogEntry[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching resource logs:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Failed to fetch resource logs:', error);
      return { data: null, error };
    }
  }

  /**
   * Get recent audit logs for dashboard
   */
  static async getRecentLogs(
    limit: number = 20
  ): Promise<{ data: AuditLogEntry[] | null; error: unknown | null }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin:admin_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent logs:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Failed to fetch recent logs:', error);
      return { data: null, error };
    }
  }

  /**
   * Get audit statistics for admin dashboard
   */
  static async getAuditStats(days: number = 30): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    topActions: { action: string; count: number }[];
    error: unknown | null;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, success')
        .gte('created_at', startDate.toISOString());

      if (error) {
        console.error('Error fetching audit stats:', error);
        return {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          topActions: [],
          error
        };
      }

      if (!data || data.length === 0) {
        return {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          topActions: [],
          error: null
        };
      }

      const totalActions = data.length;
      const successfulActions = data.filter((log: AuditLogResponse) => log.success).length;
      const failedActions = totalActions - successfulActions;

      const actionCounts: Record<string, number> = {};
      data.forEach((log: AuditLogResponse) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalActions,
        successfulActions,
        failedActions,
        topActions,
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      return {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        topActions: [],
        error
      };
    }
  }

  /**
   * Get client IP address (for logging)
   */
  private static async getClientIP(): Promise<string> {
    return 'client-side';
  }

  /**
   * Get user agent string (browser/server compatible)
   */
  private static getUserAgent(): string {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return 'server-side';
  }

  /**
   * Clean old audit logs
   */
  static async cleanOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to clean old audit logs:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to clean old audit logs:', error);
      // Don't throw - cleanup shouldn't break the application
    }
  }
}