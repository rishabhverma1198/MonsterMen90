import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertTriangle, ShieldCheck, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export default function WholesalerProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMounted = useRef(true); // Ref is better for sync cleanup than let in useEffect
  const loadingRef = useRef(true);

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    isMounted.current = true;
    loadingRef.current = true;

    const checkAuth = async () => {
      try {
        // 1. Token Check
        const token = localStorage.getItem('auth_token');
        const userType = localStorage.getItem('userType');

        if (!token) {
          // No token means not logged in - this is fine, just show error state
          if (isMounted.current) {
            setAuthState({
              user: null,
              loading: false,
              error: 'No authentication token found',
            });
            loadingRef.current = false;
          }
          return;
        }

        // 2. Check userType matches wholesaler
        if (userType !== 'wholesaler' && userType !== 'admin') {
          if (isMounted.current) {
            setAuthState({
              user: null,
              loading: false,
              error: 'Insufficient permissions - Wholesaler account required',
            });
            loadingRef.current = false;
          }
          return;
        }

        // 3. Create user object from stored data
        // In production, you'd verify the token with your API
        const mockUser: User = {
          id: '1',
          email: 'wholesaler@example.com',
          full_name: 'Wholesaler User',
          user_type: userType || 'wholesaler',
        };

        if (isMounted.current) {
          setAuthState({ user: mockUser, loading: false, error: null });
          loadingRef.current = false;
        }
      } catch (error: any) {
        if (isMounted.current) {
          setAuthState({
            user: null,
            loading: false,
            error: error.message || 'Authentication failed',
          });
          loadingRef.current = false;
        }
      }
    };

    // 3. Timeout logic (Prevents infinite spinner if API hangs)
    const timeoutId = setTimeout(() => {
      if (isMounted.current && loadingRef.current) {
        setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: 'Authentication timeout' }));
      }
    }, 5000); // Reduced timeout for faster feedback

    checkAuth();

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // --- UI STATES ---

  // 1. Loading State
  if (authState.loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Verifying access</h3>
        <p className="text-sm text-gray-500">Securing your wholesaler dashboard...</p>
      </div>
    );
  }

  // 2. Error / Not Logged In State
  if (authState.error || !authState.user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-8 shadow-sm text-center">
          <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {authState.error === 'No authentication token found' 
              ? 'You must be logged in as a wholesaler to view bulk collections and pricing.' 
              : authState.error}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/', { state: { from: location, showAuth: true, role: 'wholesaler' } })}
              className="w-full bg-blue-600 hover:bg-blue-700 h-11"
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In as Wholesaler
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full h-11">
              <Home className="mr-2 h-4 w-4" /> Back to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Success State
  return <>{children}</>;
}