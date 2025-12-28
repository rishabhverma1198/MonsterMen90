import { useEffect, useState, type ReactNode } from 'react';
import { AuthService } from '../lib/services/auth.service';
import type { User, AuthResponse, UserRole } from '../types/api-types';
import { AuthContext } from './AuthContextBase';
import type { AuthContextType } from './AuthContextBase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await AuthService.signIn({ email, password });
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    role: UserRole = 'buyer'
  ): Promise<AuthResponse> => {
    const response = await AuthService.signUp({
      email,
      password,
      full_name: fullName,
      role
    });
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const signOut = async (): Promise<void> => {
    await AuthService.signOut();
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await AuthService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
