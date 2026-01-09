import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AdminContextType } from './AdminContextValue';
import { AdminContext } from './AdminContextValue';
import type { User } from '@/types/api-types';
import { supabase } from '@/lib/supabase';

interface AdminContextProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminContextProviderProps) {
  const [admin, setAdmin] = useState<(User & { user_type?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const isAdmin = admin !== null && admin.user_type === 'admin';

  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    try {
      if (isMountedRef.current) setLoading(true);
      
      // Get current Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        // No session is normal for login page - don't log as error
        if (isMountedRef.current) {
          setAdmin(null);
          setLoading(false);
        }
        return false;
      }

      // Query user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, user_type, is_active, created_at, updated_at')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        // Only log error if it's not a "not found" error (normal for non-admin users)
        if (profileError?.code !== 'PGRST116') {
          console.error('[AdminContext] Profile error:', profileError);
        }
        if (isMountedRef.current) {
          setAdmin(null);
          setLoading(false);
        }
        return false;
      }
      
      // Check if user is admin and active
      if (profile.user_type === 'admin' && profile.is_active !== false) {
        const adminUser: User & { user_type: string } = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || '',
          role: 'admin' as any, // For backward compatibility
          user_type: profile.user_type,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
        if (isMountedRef.current) {
          setAdmin(adminUser);
          setLoading(false);
        }
        return true;
      } else {
        if (isMountedRef.current) {
          setAdmin(null);
          setLoading(false);
        }
        return false;
      }
    } catch (error) {
      console.error('[AdminContext] Admin access check failed:', error);
      if (isMountedRef.current) {
        setAdmin(null);
        setLoading(false);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    // mark mounted
    isMountedRef.current = true;

    checkAdminAccess();

    // Listen for auth state changes
    const onAuth = supabase.auth.onAuthStateChange(async (event: string, _session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkAdminAccess();
      } else if (event === 'SIGNED_OUT') {
        if (isMountedRef.current) {
          setAdmin(null);
          setLoading(false);
        }
      }
    });

    const subscription = onAuth?.data?.subscription ?? onAuth?.subscription;

    return () => {
      // mark unmounted and cleanup subscription safely
      isMountedRef.current = false;
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (e) {
        // swallow cleanup errors
      }
    };
  }, [checkAdminAccess]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear admin state
      setAdmin(null);
      setLoading(false);
    } catch (error) {
      console.error('[AdminContext] Logout failed:', error);
      // Still clear state even if signOut fails
      setAdmin(null);
      setLoading(false);
    }
  }, []);

  const contextValue: AdminContextType = {
    admin,
    loading,
    isAdmin,
    error,
    logout,
    checkAdminAccess,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Legacy export for backward compatibility
export default AdminContext;