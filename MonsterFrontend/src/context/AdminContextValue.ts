import { createContext } from 'react';
import type { User } from '@/types/api-types';

export interface AdminContextType {
  admin: (User & { user_type?: string }) | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  logout: () => Promise<void>;
  checkAdminAccess: () => Promise<boolean>;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Legacy types for backward compatibility
export interface AdminUser {
  id: string;
  email: string;
  admin_role: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminAuthType {
  token: string;
  user: AdminUser;
  isAdmin: boolean;
  expiresAt?: string;
}

// Legacy context type for backward compatibility
export interface AdminContextValueType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  adminAuth: AdminAuthType | null;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  refreshAdminUser: () => Promise<void>;
}