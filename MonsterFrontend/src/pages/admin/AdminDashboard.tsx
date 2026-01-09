import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Tags, BarChart3, Settings, LogOut, Bell, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAdminPlatform } from '@/hooks/useAdminPlatform';

// Services for fallback stats
import { orderService } from '@/lib/services/admin.service';
import { productService } from '@/lib/services/admin.service';
import { adminUserService } from '@/lib/services/admin.service';

// Modules
import AdminProductManagement from './AdminProductManagement';
import AdminOrderManagement from './AdminOrderManagement';
import AdminUserManagement from './AdminUserManagement';
import AdminCategoryManagement from './AdminCategoryManagement';
import AdminAnalytics from './AdminAnalytics';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { kpis, realtimeHealthy, inventoryAlerts, loading: platformLoading, error: platformError } = useAdminPlatform();

  const fetchStats = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use service methods instead of direct Supabase calls
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        orderService.getOrders(),
        productService.getProducts(),
        adminUserService.getUsers()
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const users = usersRes.data || [];

      setStats({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        totalProducts: products.length,
        totalUsers: users.length
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Show loading state if platform is loading
  if (platformLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (platformError || error) {
    return (
      <div className="p-8">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{platformError || error}</p>
          <Button onClick={fetchStats} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Revenue" value={`₹${(kpis.totalRevenue || stats.totalRevenue).toLocaleString()}`} icon={BarChart3} />
          <StatCard title="Orders" value={kpis.totalOrders || stats.totalOrders} icon={ShoppingCart} />
          <StatCard title="Alerts" value={inventoryAlerts.length} icon={AlertTriangle} color="text-red-600" />
          <StatCard title="Active Users" value={stats.totalUsers} icon={Users} />
        </div>

        {inventoryAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-4 text-red-700">
              <AlertTriangle />
              <span>Attention: <b>{inventoryAlerts.length}</b> variants are below critical stock levels!</span>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No recent activity to display.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${realtimeHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{realtimeHealthy ? 'Systems Live' : 'Reconnecting...'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-gray-900" }: any) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</CardTitle>
        <Icon size={16} className="text-gray-400" />
      </CardHeader>
      <CardContent><div className={`text-2xl font-bold ${color}`}>{value}</div></CardContent>
    </Card>
  );
}