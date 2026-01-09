import React, { Suspense, useCallback, useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './components/ui/button';

/**
 * Application Configuration
 * Centralized configuration for environment-based settings
 */
interface AppConfig {
  isDevelopment: boolean;
  enableDebugLogging: boolean;
  enableErrorReporting: boolean;
  appName: string;
  version: string;
}

const getAppConfig = (): AppConfig => ({
  isDevelopment: import.meta.env.DEV,
  enableDebugLogging: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableErrorReporting: import.meta.env.PROD && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  appName: import.meta.env.VITE_APP_NAME || 'MonsterMen90',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
});

/**
 * Network status hook for handling offline/online scenarios
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

/**
 * Loading state component for initial app load
 */
const AppLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-75"></div>
    </div>
    <p className="mt-6 text-lg font-semibold text-gray-700 animate-pulse">
      Loading {getAppConfig().appName}...
    </p>
    <p className="mt-2 text-sm text-gray-500">
      Version {getAppConfig().version}
    </p>
  </div>
);

/**
 * Network error component for offline scenarios
 */
const NetworkError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full text-center">
      <div className="bg-white rounded-lg shadow-lg border p-8">
        <div className="mb-6">
          <WifiOff className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            Please check your internet connection and try again.
          </p>
        </div>
        
        <Button 
          onClick={onRetry}
          className="w-full"
          variant="default"
        >
          <Wifi className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

/**
 * Main App component with enhanced error handling and performance optimizations
 *
 * Features:
 * - Global error boundary integration
 * - Network status monitoring
 * - Environment-based configuration
 * - Performance optimizations
 * - Accessibility considerations
 * - Error reporting integration
 */
const App: React.FC = React.memo(() => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasInitialLoadError, setHasInitialLoadError] = useState(false);
  const isOnline = useNetworkStatus();
  const config = getAppConfig();

  /**
   * Error handler for logging and reporting
   */
  const handleAppError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    // Log to console in development
    if (config.enableDebugLogging) {
      console.group('🚨 Application Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (config.enableErrorReporting) {
      // Example integration with error reporting service
      // errorReportingService.captureException(error, {
      //   extra: errorInfo,
      //   tags: {
      //     component: 'App',
      //     version: config.version
      //   }
      // });
    }
  }, [config]);
  
  // Initialize app with error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add any app initialization logic here
        // For example: checking auth tokens, loading configurations, etc.
        
        // Simulate minimal initialization time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsAppReady(true);
        
        // Debug logging in development
        if (config.enableDebugLogging) {
          console.log('🚀 App initialized successfully', {
            environment: config.isDevelopment ? 'development' : 'production',
            version: config.version,
            appName: config.appName
          });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setHasInitialLoadError(true);
      }
    };
    
    initializeApp();
  }, [config]);
  
  // Handle retry for network errors
  const handleNetworkRetry = useCallback(() => {
    if (isOnline) {
      setHasInitialLoadError(false);
      setIsAppReady(false);
      // Re-initialize app
      setTimeout(() => setIsAppReady(true), 100);
    }
  }, [isOnline]);
  
  // Show network error if offline
  if (!isOnline) {
    return <NetworkError onRetry={handleNetworkRetry} />;
  }
  
  // Show initial load error
  if (hasInitialLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg border p-8">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to Load App
              </h1>
              <p className="text-gray-600">
                Something went wrong while initializing the application. Please refresh the page.
              </p>
            </div>
            
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state while app is initializing
  if (!isAppReady) {
    return <AppLoader />;
  }
  
  // Main app render with error boundary
  return (
    <GlobalErrorBoundary onError={handleAppError}>
      <div id="app-root" className="min-h-screen bg-gray-50">
        <Suspense 
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </div>
    </GlobalErrorBoundary>
  );
});

// Display name for debugging
App.displayName = 'App';

export default App;