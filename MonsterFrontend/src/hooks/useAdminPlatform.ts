import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { apiService } from "@/lib/services/api.service";
import { useAdmin } from "@/context/useAdmin";
import { useAuth } from "@/hooks/useAuth";

/**
 * useAdminPlatform - Bulletproof Authentication Flow
 * 
 * ✅ Sequential Logic Guards: Waits for isAuthenticated AND isAdmin
 * ✅ Guard Clause: Blocks API calls while session is loading
 * ✅ Dynamic token injection via api.service.ts
 * ✅ No requests sent without valid token
 */

interface AdminPlatformData {
  orders: any[];
  inventoryAlerts: any[];
  analytics: any[];
  kpis: {
    totalOrders: number;
    totalRevenue: number;
    lowStockCount: number;
  };
  realtimeHealthy: boolean;
  loading: boolean;
  error: string | null;
}

export function useAdminPlatform(): AdminPlatformData & {
  refetch: () => Promise<void>;
} {
  const { isAdmin, admin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();
  
  // ===============================
  // STATE
  // ===============================
  const [orders, setOrders] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
  });

  const [realtimeHealthy, setRealtimeHealthy] = useState(true);

  // Refs for cleanup
  const heartbeatRef = useRef(false);
  const fallbackIntervalRef = useRef<number | null>(null);
  const ordersChannelRef = useRef<any>(null);
  const inventoryChannelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  // ===============================
  // GUARD: Check if ready to fetch
  // ===============================
  const isReadyToFetch = useCallback((): boolean => {
    // Guard Clause: Block if loading
    if (authLoading || adminLoading) {
      return false;
    }
    
    // Guard Clause: Block if not authenticated
    if (!user) {
      return false;
    }
    
    // Guard Clause: Block if not admin
    if (!isAdmin || !admin) {
      return false;
    }
    
    return true;
  }, [authLoading, adminLoading, user, isAdmin, admin]);

  // ===============================
  // FETCHERS WITH PROPER AUTH
  // ===============================

  const fetchOrders = useCallback(async (): Promise<void> => {
    // Guard Clause: Prevent duplicate calls
    if (isFetchingRef.current) return;
    
    // Guard Clause: Block if not ready
    if (!isReadyToFetch()) {
      setOrders([]);
      setKpis((k) => ({ ...k, totalOrders: 0, totalRevenue: 0 }));
      return;
    }

    try {
      isFetchingRef.current = true;
      
      // api.service.ts handles token injection automatically
      const response = await apiService.get('/orders/admin');

      if (response.error) {
        // Stop polling on 401
        if (response.error.includes('401') || response.error.includes('Unauthorized')) {
          setError('Unauthorized: Please login again');
          setOrders([]);
          setKpis((k) => ({ ...k, totalOrders: 0, totalRevenue: 0 }));
          // Stop all polling
          if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
          }
          return;
        }
        
        if (response.error.includes('403') || response.error.includes('Forbidden')) {
          setError('Forbidden: Admin access required');
          setOrders([]);
          setKpis((k) => ({ ...k, totalOrders: 0, totalRevenue: 0 }));
          return;
        }

        throw new Error(response.error);
      }

      const data = Array.isArray(response.data) ? response.data : [];
      if (!isMountedRef.current) return;
      
      setOrders(data);
      setError(null);

      const revenue = data.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      setKpis((k) => ({
        ...k,
        totalOrders: data.length,
        totalRevenue: revenue,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('[useAdminPlatform] Error fetching orders:', errorMessage);
      setError(errorMessage);
      setOrders([]);
      setKpis((k) => ({ ...k, totalOrders: 0, totalRevenue: 0 }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [isReadyToFetch]);

  const fetchInventoryAlerts = useCallback(async (): Promise<void> => {
    // Guard Clause: Block if not ready
    if (!isReadyToFetch()) {
      setInventoryAlerts([]);
      setKpis((k) => ({ ...k, lowStockCount: 0 }));
      return;
    }

    try {
      // api.service.ts handles token injection automatically
      const response = await apiService.get('/inventory/low-stock');

      if (response.error) {
        if (response.error.includes('401') || response.error.includes('Unauthorized')) {
          setInventoryAlerts([]);
          setKpis((k) => ({ ...k, lowStockCount: 0 }));
          return;
        }
        
        if (response.error.includes('403') || response.error.includes('Forbidden')) {
          setInventoryAlerts([]);
          setKpis((k) => ({ ...k, lowStockCount: 0 }));
          return;
        }

        throw new Error(response.error);
      }

      const data = Array.isArray(response.data) ? response.data : [];
      if (!isMountedRef.current) return;
      
      setInventoryAlerts(data);

      setKpis((k) => ({
        ...k,
        lowStockCount: data.length,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory alerts';
      console.error('[useAdminPlatform] Error fetching inventory alerts:', errorMessage);
      setInventoryAlerts([]);
      setKpis((k) => ({ ...k, lowStockCount: 0 }));
    }
  }, [isReadyToFetch]);

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    // Guard Clause: Block if not ready
    if (!isReadyToFetch()) {
      setAnalytics([]);
      return;
    }

    try {
      // api.service.ts handles token injection automatically
      const response = await apiService.get('/orders/analytics/daily-sales');

      if (response.error) {
        if (response.error.includes('401') || response.error.includes('Unauthorized')) {
          setAnalytics([]);
          return;
        }
        
        if (response.error.includes('403') || response.error.includes('Forbidden')) {
          setAnalytics([]);
          return;
        }

        // If daily_sales table doesn't exist, return empty array
        if (response.error.includes('daily_sales') || response.error.includes('does not exist')) {
          console.warn('[useAdminPlatform] daily_sales table not found, returning empty analytics');
          setAnalytics([]);
          return;
        }

        throw new Error(response.error);
      }

      const data = Array.isArray(response.data) ? response.data : [];
      if (!isMountedRef.current) return;
      
      setAnalytics(data);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      console.error('[useAdminPlatform] Error fetching analytics:', errorMessage);
      setAnalytics([]);
    }
  }, [isReadyToFetch]);

  // ===============================
  // REFETCH FUNCTION
  // ===============================
  const refetch = useCallback(async () => {
    // Guard Clause: Block if not ready
    if (!isReadyToFetch()) return;
    
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchOrders(),
      fetchInventoryAlerts(),
      fetchAnalytics()
    ]);
    
    if (isMountedRef.current) {
      setLoading(false);
    }
  }, [isReadyToFetch, fetchOrders, fetchInventoryAlerts, fetchAnalytics]);

  // ===============================
  // INITIAL DATA FETCH
  // Sequential Logic: Wait for isAuthenticated AND isAdmin
  // ===============================
  useEffect(() => {
    isMountedRef.current = true;
    
    // Guard Clause: Block while loading
    if (authLoading || adminLoading) {
      setLoading(true);
      return;
    }
    
    // Guard Clause: Block if not authenticated
    if (!user) {
      setLoading(false);
      setError('Authentication required');
      return;
    }
    
    // Guard Clause: Block if not admin
    if (!isAdmin || !admin) {
      setLoading(false);
      setError('Admin authentication required');
      return;
    }
    
    // All guards passed - safe to fetch
    const initializeData = async () => {
      setLoading(true);
      
      // Fetch all data (api.service.ts handles token injection)
      await Promise.all([
        fetchOrders(),
        fetchInventoryAlerts(),
        fetchAnalytics()
      ]);
      
      if (isMountedRef.current) {
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      isMountedRef.current = false;
    };
  }, [authLoading, adminLoading, user, isAdmin, admin, fetchOrders, fetchInventoryAlerts, fetchAnalytics]);

  // ===============================
  // REALTIME + FALLBACK (WITH PROPER CLEANUP)
  // ===============================
  useEffect(() => {
    // Guard Clause: Don't set up realtime if not ready
    if (!isReadyToFetch()) {
      return;
    }

    let cleanup: (() => void) | null = null;

    const setupRealtime = async () => {
      // Verify session before setting up realtime
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMountedRef.current) {
        return;
      }

      // Clean up existing channels
      if (ordersChannelRef.current) {
        supabase.removeChannel(ordersChannelRef.current);
      }
      if (inventoryChannelRef.current) {
        supabase.removeChannel(inventoryChannelRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }

      // Set up Supabase realtime channels
      const ordersChannel = supabase
        .channel("orders-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          async () => {
            if (!isMountedRef.current || !isReadyToFetch()) return;
            heartbeatRef.current = true;
            setRealtimeHealthy(true);
            await fetchOrders();
          }
        )
        .subscribe();

      const inventoryChannel = supabase
        .channel("inventory-live")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "product_variants" },
          async () => {
            if (!isMountedRef.current || !isReadyToFetch()) return;
            heartbeatRef.current = true;
            setRealtimeHealthy(true);
            await fetchInventoryAlerts();
          }
        )
        .subscribe();

      ordersChannelRef.current = ordersChannel;
      inventoryChannelRef.current = inventoryChannel;

      // Fallback polling (only if realtime fails) - 30 seconds
      fallbackIntervalRef.current = window.setInterval(async () => {
        if (!isMountedRef.current || !isReadyToFetch()) {
          if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
          }
          return;
        }

        if (!heartbeatRef.current) {
          setRealtimeHealthy(false);
          await fetchOrders();
          await fetchInventoryAlerts();
          await fetchAnalytics();
        }
        heartbeatRef.current = false;
      }, 30000);

      cleanup = () => {
        if (ordersChannelRef.current) {
          supabase.removeChannel(ordersChannelRef.current);
          ordersChannelRef.current = null;
        }
        if (inventoryChannelRef.current) {
          supabase.removeChannel(inventoryChannelRef.current);
          inventoryChannelRef.current = null;
        }
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
      };
    };

    setupRealtime();

    // Cleanup on unmount or when ready state changes
    return () => {
      if (cleanup) {
        cleanup();
      }
      if (ordersChannelRef.current) {
        supabase.removeChannel(ordersChannelRef.current);
        ordersChannelRef.current = null;
      }
      if (inventoryChannelRef.current) {
        supabase.removeChannel(inventoryChannelRef.current);
        inventoryChannelRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [isReadyToFetch, fetchOrders, fetchInventoryAlerts, fetchAnalytics]);

  // ===============================
  // RETURN
  // ===============================
  return {
    orders,
    inventoryAlerts,
    analytics,
    kpis,
    realtimeHealthy,
    loading,
    error,
    refetch,
  };
}
