import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { Loader2, AlertTriangle, RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- TYPES ---
interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  timeoutMs?: number;
  enableRetry?: boolean;
}

// --- CONSTANTS ---
const DEFAULT_TIMEOUT_MS = 6000; 
const DEFAULT_REDIRECT_PATH = '/admin/login';

const ERROR_MESSAGES = {
  TIMEOUT: 'Security verification is taking longer than expected. Please check your connection.',
  ACCESS_DENIED: 'Restricted Area: Administrative privileges are required to access this resource.',
  SESSION_EXPIRED: 'Your administrative session has expired. Please log in again.',
  UNKNOWN_ERROR: 'A critical error occurred during permission synchronization.'
} as const;

// --- INTERNAL UI COMPONENTS ---

const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white/50 backdrop-blur-md">
    <div className="relative flex items-center justify-center">
      <Loader2 className="w-14 h-14 text-orange-600 animate-spin" />
      <ShieldAlert className="w-6 h-6 text-orange-400 absolute" />
    </div>
    <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-xl font-bold text-slate-900">Authenticating Secure Access</h3>
      <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
        Verifying your administrator credentials with our security gateway...
      </p>
    </div>
  </div>
));

const AccessDeniedState = memo<{
  errorMessage: string;
  onReturnHome: () => void;
  onRetry?: () => void;
  showRetry: boolean;
}>(({ errorMessage, onReturnHome, onRetry, showRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
      <div className="bg-red-600 p-8 flex justify-center">
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
          <ShieldAlert className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-8 text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Security Alert</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {errorMessage}
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="default" className="w-full bg-slate-900 hover:bg-slate-800 py-6 text-base rounded-xl">
              <RefreshCw className="mr-2 h-5 w-5" /> Re-Verify Identity
            </Button>
          )}
          <Button onClick={onReturnHome} variant="outline" className="w-full py-6 text-base border-slate-200 rounded-xl">
            <ArrowLeft className="mr-2 h-5 w-5" /> Exit to Safety
          </Button>
        </div>
      </div>
    </div>
  </div>
));

// --- MAIN PROTECTION COMPONENT ---

export default function AdminProtectedRoute({
  children,
  fallbackPath = DEFAULT_REDIRECT_PATH,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  enableRetry = true
}: AdminProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalError, setInternalError] = useState<string>();
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  const { isAdmin, loading } = useAdmin();
  const hasLoggedError = useRef(false);

  // 1. Unified Security Check & Logging
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (loading) {
      timer = setTimeout(() => {
        setIsTimedOut(true);
        setInternalError(ERROR_MESSAGES.TIMEOUT);
        console.error("[Security] Admin verification timed out at", location.pathname);
      }, timeoutMs);
    }

    return () => clearTimeout(timer);
  }, [loading, timeoutMs, location.pathname]);

  // 2. Audit Log for Access Denied (Industry Standard)
  useEffect(() => {
    if (!loading && !isAdmin && !hasLoggedError.current) {
      console.warn(`[Security Alert] Unauthorized admin access attempt to ${location.pathname} by IP/User Session.`);
      hasLoggedError.current = true;
    }
  }, [loading, isAdmin, location.pathname]);

  // 3. Handlers
  const handleReturnHome = useCallback(() => {
    sessionStorage.setItem('last_denied_admin_route', location.pathname);
    navigate('/');
  }, [location.pathname, navigate]);

  const handleRetry = useCallback(() => {
    hasLoggedError.current = false;
    window.location.reload();
  }, []);

  // --- RENDERING LOGIC ---

  if (loading) return <LoadingState />;

  // Validation Logic
  const accessError = internalError;
  const isAuthorized = isAdmin && !accessError;

  if (!isAuthorized) {
    // If we have a fallback path and the user isn't an admin, redirect
    if (fallbackPath && !isAdmin) {
      return <Navigate to={fallbackPath} state={{ from: location, reason: 'unauthorized' }} replace />; //
    }
    
    return (
      <AccessDeniedState
        errorMessage={accessError || ERROR_MESSAGES.ACCESS_DENIED}
        onReturnHome={handleReturnHome}
        onRetry={enableRetry ? handleRetry : undefined}
        showRetry={enableRetry}
      />
    );
  }

  return <>{children}</>;
}