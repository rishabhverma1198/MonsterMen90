import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useAdminPlatform
 * - Admin auth roles
 * - Multi-store isolation
 * - Orders realtime + fallback
 * - Inventory low-stock alerts
 * - KPIs (orders, revenue, low stock)
 * - Analytics (daily_sales)
 * - Realtime health indicator
 */

export function useAdminPlatform() {
  // ===============================
  // STATE
  // ===============================
  const [orders, setOrders] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);

  const [kpis, setKpis] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
  });

  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [realtimeHealthy, setRealtimeHealthy] = useState(true);

  const heartbeatRef = useRef(false);
  const fallbackRef = useRef<number | null>(null);

  // ===============================
  // CONTEXT (ADMIN + STORE)
  // ===============================
  const loadAdminContext = async () => {
    const { data } = await supabase
      .from("admin_users")
      .select("role, store_id")
      .single();

    if (data) {
      setUserRole(data.role);
      setStoreId(data.store_id);
    }
  };

  // ===============================
  // FETCHERS
  // ===============================
  const fetchOrders = async () => {
    if (!storeId) return;

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    setOrders(data || []);

    const revenue =
      data?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;

    setKpis((k) => ({
      ...k,
      totalOrders: data?.length || 0,
      totalRevenue: revenue,
    }));
  };

  const fetchInventoryAlerts = async () => {
    if (!storeId) return;

    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("store_id", storeId)
      .eq("low_stock", true);

    setInventoryAlerts(data || []);

    setKpis((k) => ({
      ...k,
      lowStockCount: data?.length || 0,
    }));
  };

  const fetchAnalytics = async () => {
    if (!storeId) return;

    const { data } = await supabase
      .from("daily_sales")
      .select("*")
      .eq("store_id", storeId)
      .order("day", { ascending: false });

    setAnalytics(data || []);
  };

  // ===============================
  // INIT
  // ===============================
  useEffect(() => {
    loadAdminContext();
  }, []);

  // ===============================
  // REALTIME + FALLBACK
  // ===============================
  useEffect(() => {
    if (!storeId) return;

    fetchOrders();
    fetchInventoryAlerts();
    fetchAnalytics();

    const ordersChannel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async () => {
          heartbeatRef.current = true;
          setRealtimeHealthy(true);
          await fetchOrders();
        }
      )
      .subscribe();

    const inventoryChannel = supabase
      .channel("admin-inventory")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inventory" },
        async () => {
          heartbeatRef.current = true;
          setRealtimeHealthy(true);
          await fetchInventoryAlerts();
        }
      )
      .subscribe();

    fallbackRef.current = setInterval(async () => {
      if (!heartbeatRef.current) {
        setRealtimeHealthy(false);
        await fetchOrders();
        await fetchInventoryAlerts();
        await fetchAnalytics();
      }
      heartbeatRef.current = false;
    }, 5000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inventoryChannel);
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [storeId]);

  // ===============================
  // RETURN
  // ===============================
  return {
    // auth
    userRole,        // super_admin | store_admin | staff
    storeId,

    // data
    orders,
    inventoryAlerts,
    analytics,

    // kpis
    kpis,

    // health
    realtimeHealthy, // 🟢 / 🔴
  };
}