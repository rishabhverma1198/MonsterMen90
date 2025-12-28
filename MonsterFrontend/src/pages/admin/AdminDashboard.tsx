import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Tags, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  DollarSign,
  ShoppingBag,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// Import admin components
import AdminProductManagement from './AdminProductManagement';
import AdminOrderManagement from './AdminOrderManagement';
import AdminUserManagement from './AdminUserManagement';
import AdminCategoryManagement from './AdminCategoryManagement';
import AdminAnalytics from './AdminAnalytics';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  lowStockItems: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkAdminAuth = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        navigate('/admin/login');
        return;
      }
      
      if (!currentUser) {
        navigate('/admin/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        navigate('/admin/login');
        return;
      }

      if (!profile || profile.user_type !== 'admin') {
        navigate('/admin/login');
        return;
      }

      setUser({ id: currentUser.id, email: currentUser.email || null });
      setError(null);
    } catch (err) {
      console.error('Authentication check failed:', err);
      setError('Authentication failed');
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch orders count and revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status');

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw new Error('Failed to fetch orders');
      }

      // Fetch products count
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id');

      if (productsError) {
        console.error('Products fetch error:', productsError);
        throw new Error('Failed to fetch products');
      }

      // Fetch users count
      const { data: userData, error: usersError } = await supabase
        .from('users')
        .select('id, user_type');

      if (usersError) {
        console.error('Users fetch error:', usersError);
        throw new Error('Failed to fetch users');
      }

      // Fetch low stock items
      const { data: stockItems, error: stockError } = await supabase
        .from('product_variants')
        .select('quantity')
        .lt('quantity', 10);

      if (stockError) {
        console.error('Stock fetch error:', stockError);
        throw new Error('Failed to fetch stock data');
      }

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        totalProducts: products?.length || 0,
        totalUsers: userData?.length || 0,
        pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
        lowStockItems: stockItems?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAdmin = async () => {
      try {
        setIsLoading(true);
        await checkAdminAuth();
        
        if (isMounted) {
          await fetchDashboardStats();
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        if (isMounted) {
          setError('Failed to initialize dashboard');
          setIsLoading(false);
        }
      }
    };
    
    initializeAdmin();
    
    return () => {
      isMounted = false;
    };
  }, [checkAdminAuth, fetchDashboardStats]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        setError('Logout failed');
      } else {
        navigate('/admin/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome to MonsterMen90 Admin Panel</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingOrders} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.lowStockItems} low stock
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active users
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('products')}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('orders')}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Pending Orders
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Sales Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerts & Notifications</CardTitle>
                  <CardDescription>System notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.pendingOrders > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{stats.pendingOrders} orders pending</span>
                    </div>
                  )}
                  {stats.lowStockItems > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{stats.lowStockItems} products low in stock</span>
                    </div>
                  )}
                  {stats.pendingOrders === 0 && stats.lowStockItems === 0 && (
                    <div className="text-sm text-green-600">All systems running smoothly!</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'products':
        return <AdminProductManagement />;
        
      case 'orders':
        return <AdminOrderManagement />;
        
      case 'users':
        return <AdminUserManagement />;
        
      case 'categories':
        return <AdminCategoryManagement />;
        
      case 'analytics':
        return <AdminAnalytics />;

      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Settings</h2>
              <p className="text-gray-600">Admin settings panel coming soon...</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">{menuItems.find(item => item.id === activeTab)?.label}</h2>
              <p className="text-gray-600">This section is being developed...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">MonsterMen90 Admin</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search..." 
                className="pl-10 w-64"
              />
            </div>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => {
                  setError(null);
                  fetchDashboardStats();
                }}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            renderMainContent()
          )}
        </main>
      </div>
    </div>
  );
}