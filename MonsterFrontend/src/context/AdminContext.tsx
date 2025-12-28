import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/api-types';
import type { ReactNode } from 'react';
import { AdminContext } from './AdminContextValue';

// Timeout for admin status check (3 seconds)
const ADMIN_CHECK_TIMEOUT = 3000;

// Fallback admin check with timeout
const checkAdminStatusWithTimeout = async (
  setAdmin: (admin: (User & { admin_role?: string }) | null) => void,
  setLoading: (loading: boolean) => void
): Promise<void> => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Admin check timeout')), ADMIN_CHECK_TIMEOUT);
    });

    // Create the admin check promise
    const checkPromise = async () => {
      try {
        // First check if there's an active session
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Session error:', sessionError);
          setAdmin(null);
          setLoading(false);
          return;
        }

        if (!session) {
          // No active session, user is not authenticated
          setAdmin(null);
          setLoading(false);
          return;
        }

        const { user: authUser } = session;
        
        if (!authUser) {
          setAdmin(null);
          setLoading(false);
          return;
        }

        // Try to get user profile with error handling and shorter timeout
        try {
          const profilePromise = supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          // Race between profile check and a shorter timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile check timeout')), 1000);
          });

          const { data: profile, error } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (error || !profile) {
            // If users table doesn't exist or other DB error, assume not admin
            console.warn('User profile fetch error:', error);
            setAdmin(null);
            setLoading(false);
            return;
          }

          // Check if user is admin
          if (profile.user_type === 'admin') {
            setAdmin(profile);
          } else {
            setAdmin(null);
          }
        } catch (profileError) {
          // If profile check fails, assume not admin
          console.warn('Profile check failed:', profileError);
          setAdmin(null);
        }
      } catch (error) {
        console.error('Admin status check failed:', error);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    // Race between check and timeout
    await Promise.race([checkPromise(), timeoutPromise]);
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin check timeout') {
      console.warn('Admin check timed out after', ADMIN_CHECK_TIMEOUT, 'ms');
    } else {
      console.error('Admin check error:', error);
    }
    setAdmin(null);
    setLoading(false);
  }
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<(User & { admin_role?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatusWithTimeout(setAdmin, setLoading);

    // Subscribe to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAdmin(null);
        setLoading(false);
      } else if (session && event === 'SIGNED_IN') {
        await checkAdminStatusWithTimeout(setAdmin, setLoading);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const checkAdminAccess = async (): Promise<boolean> => {
    try {
      // First check if there's an active session
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return false;
      }

      const { user } = session;
      if (!user) return false;

      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      return profile?.user_type === 'admin';
    } catch (error) {
      console.error('Check admin access error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        isAdmin: !!admin,
        logout,
        checkAdminAccess
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
