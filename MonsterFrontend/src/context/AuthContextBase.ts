import { createContext } from 'react';
import type { User, AuthResponse, UserRole } from '../types/api-types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionValid: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, fullName?: string, role?: UserRole) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  needsSessionRefresh: () => boolean;
  extendSession: () => boolean;
  getSessionStats: () => any;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { AuthContextType };

export { useAuth } from '../hooks/useAuth';