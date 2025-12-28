import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

// Types and Interfaces
interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  timeoutMs?: number;
  enableRetry?: boolean;
}

// Constants
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const DEFAULT_REDIRECT_PATH = '/';
const ERROR_MESSAGES = {
  TIMEOUT: 'Request timed out. Please try again.',
  ACCESS_DENIED: 'You do not have administrator privileges to access this area.',
  NETWORK_ERROR: 'Unable to verify admin access. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred while verifying your permissions.'
} as const;

// Custom Hook for Admin State Management
const useAdminWithErrorHandling = (timeoutMs: number) => {
  const [error, setError] = useState<string>();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  const adminHook = useAdmin();
  const { loading } = adminHook;

  // Handle timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setTimeoutReached(true);
        setError(ERROR_MESSAGES.TIMEOUT);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [loading, timeoutMs]);

  // Reset error states when loading starts
  useEffect(() => {
    if (loading) {
      setError(undefined);
      setTimeoutReached(false);
    }
  }, [loading]);

  const errorMessage = error || (timeoutReached ? ERROR_MESSAGES.TIMEOUT : undefined);

  return {
    ...adminHook,
    error: errorMessage,
    timeoutReached
  };
};

// UI Components (separated for better maintainability)
const LoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Verifying Admin Access
      </h3>
      <p className="text-gray-600 mb-4">
        Please wait while we check your permissions...
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          This usually takes a few seconds. If it takes longer, there might be a connection issue.
        </p>
      </div>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

const AccessDeniedState = memo<{
  errorMessage: string;
  onReturnHome: () => void;
  onRetry?: () => void;
  showRetry: boolean;
}>(({ errorMessage, onReturnHome, onRetry, showRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-600 mb-4">
        {errorMessage}
      </p>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-red-700">
          Admin access required. Please contact your system administrator.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {showRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="Retry admin verification"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onReturnHome}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  </div>
));

AccessDeniedState.displayName = 'AccessDeniedState';

// Main Component
export default function AdminProtectedRoute({
  children,
  fallbackPath = DEFAULT_REDIRECT_PATH,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  enableRetry = true
}: AdminProtectedRouteProps) {
  const location = useLocation();
  
  // Enhanced admin hook with error handling
  const {
    isAdmin,
    loading,
    error: adminError,
    timeoutReached
  } = useAdminWithErrorHandling(timeoutMs);

  // Memoize expensive values
  const errorMessage = useMemo(() => {
    if (adminError) return adminError;
    return undefined;
  }, [adminError]);

  const showRetry = useMemo(() => {
    return enableRetry && Boolean(adminError || timeoutReached);
  }, [enableRetry, adminError, timeoutReached]);

  // Memoized navigation handlers
  const handleReturnHome = useCallback(() => {
    // Store the attempted location for potential future use
    sessionStorage.setItem('admin_access_attempt', location.pathname);
  }, [location.pathname]);

  const handleRetry = useCallback(() => {
    // Force re-check by triggering a page reload or re-render
    window.location.reload();
  }, []);

  // Memoize children to prevent unnecessary re-renders
  const memoizedChildren = useMemo(() => children, [children]);

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show error state or access denied
  if (!isAdmin || adminError || timeoutReached) {
    // Use fallback path if provided, otherwise show error state
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    return (
      <AccessDeniedState
        errorMessage={errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR}
        onReturnHome={handleReturnHome}
        onRetry={showRetry ? handleRetry : undefined}
        showRetry={showRetry}
      />
    );
  }

  // If admin, render children
  return <>{memoizedChildren}</>;
}

// Export types for external use
export type { AdminProtectedRouteProps };
