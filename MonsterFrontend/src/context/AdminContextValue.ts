import { createContext } from 'react';
import type { User } from '@/types/api-types';

export interface AdminContextType {
  admin: (User & { admin_role?: string }) | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  checkAdminAccess: () => Promise<boolean>;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);