import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Download,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Type definitions for better TypeScript support
interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'buyer' | 'wholeseller' | 'admin';
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  order_items?: OrderItem[];
}

interface Category {
  id: string;
  name: string;
  products?: Product[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products?: {
    name: string;
    base_price: number;
  };
  orders?: {
    total_amount: number;
    created_at: string;
  };
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
  topCategories: Array<{
    name: string;
    revenue: number;
    orders: number;
  }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    users: {
      full_name: string;
      email: string;
    };
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  userTypeDistribution: {
    buyers: number;
    wholesalers: number;
    admins: number;
  };
  orderStatusDistribution: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    userGrowth: 0,
    topProducts: [],
    topCategories: [],
    recentOrders: [],
    monthlyRevenue: [],
    userTypeDistribution: { buyers: 0, wholesalers: 0, admins: 0 },
    orderStatusDistribution: { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch orders data with proper error handling
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      // Fetch products data with proper error handling
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      // Fetch users data with proper error handling
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      // Fetch categories with product counts
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          products (
            id,
            base_price,
            order_items (
              quantity,
              unit_price
            )
          )
        `);

      if (categoriesError) {
        throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
      }

      const orderIds = orders?.map((o: Order) => o.id) || [];

      // Fetch order items for product analytics
      let orderItems: OrderItem[] | null = [];
      if (orderIds.length > 0) {
        const { data, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (
              name,
              base_price
            ),
            orders (
              total_amount,
              created_at
            )
          `)
          .in('order_id', orderIds);

        if (orderItemsError) {
          console.error("Supabase order_items error:", orderItemsError);
          throw new Error(`Failed to fetch order items: ${orderItemsError.message}`);
        }
        orderItems = data;
      }

      // Process data for analytics
      const totalRevenue = orders?.reduce((sum: number, order: Order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalProducts = products?.length || 0;
      const totalUsers = users?.length || 0;

      // Calculate growth (simplified - comparing with previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - parseInt(timeRange));
       
      const { data: prevOrders, error: prevOrdersError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      if (prevOrdersError) {
        console.warn('Failed to fetch previous orders for growth calculation:', prevOrdersError);
      }

      const prevRevenue = prevOrders?.reduce((sum: number, order: { total_amount: number }) => sum + (order.total_amount || 0), 0) || 0;
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const orderGrowth = prevOrders && prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;

      // Top products analysis (with safety checks)
      const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();
      orderItems?.forEach((item: OrderItem) => {
        const productName = item?.products?.name || 'Unknown';
        const existing = productRevenue.get(productName) || { name: productName, revenue: 0, quantity: 0 };
        existing.revenue += (item?.quantity || 0) * (item?.unit_price || 0);
        existing.quantity += item?.quantity || 0;
        productRevenue.set(productName, existing);
      });

      const topProducts = Array.from(productRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top categories analysis (with safety checks)
      const categoryRevenue = new Map<string, { name: string; revenue: number; orders: number }>();
      categories?.forEach((category: Category) => {
        let categoryTotal = 0;
        let categoryOrders = 0;
        category?.products?.forEach((product: Product) => {
          const orderItems = product?.order_items || [];
          orderItems.forEach((item: OrderItem) => {
            categoryTotal += (item?.quantity || 0) * (item?.unit_price || 0);
            categoryOrders += 1;
          });
        });
        categoryRevenue.set(category?.name || 'Unknown', { 
          name: category?.name || 'Unknown', 
          revenue: categoryTotal, 
          orders: categoryOrders 
        });
      });

      const topCategories = Array.from(categoryRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // User type distribution (with safety checks)
      const userTypeDistribution = {
        buyers: users?.filter((u: User) => u?.user_type === 'buyer').length || 0,
        wholesalers: users?.filter((u: User) => u?.user_type === 'wholeseller').length || 0,
        admins: users?.filter((u: User) => u?.user_type === 'admin').length || 0
      };

      // Order status distribution (with safety checks)
      const orderStatusDistribution = {
        pending: orders?.filter((o: Order) => o?.status === 'pending').length || 0,
        confirmed: orders?.filter((o: Order) => o?.status === 'confirmed').length || 0,
        shipped: orders?.filter((o: Order) => o?.status === 'shipped').length || 0,
        delivered: orders?.filter((o: Order) => o?.status === 'delivered').length || 0,
        cancelled: orders?.filter((o: Order) => o?.status === 'cancelled').length || 0
      };

      // Recent orders
      const recentOrders = orders?.slice(0, 10) || [];

      // Monthly revenue (improved calculation)
      const monthlyRevenue = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const monthOrders = orders?.filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }) || [];
        
        monthlyRevenue.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthOrders.reduce((sum: number, order: Order) => sum + (order.total_amount || 0), 0),
          orders: monthOrders.length
        });
      }

      // Calculate user growth
      const { data: prevUsers, error: prevUsersError } = await supabase
        .from('users')
        .select('id')
        .lte('created_at', startDate.toISOString());

      if (prevUsersError) {
        console.warn('Failed to fetch previous users for growth calculation:', prevUsersError);
      }

      const prevUsersCount = prevUsers?.length || 0;
      const userGrowth = prevUsersCount > 0 ? ((totalUsers - prevUsersCount) / prevUsersCount) * 100 : 0;

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
        revenueGrowth,
        orderGrowth,
        userGrowth,
        topProducts,
        topCategories,
        recentOrders,
        monthlyRevenue,
        userTypeDistribution,
        orderStatusDistribution
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const exportData = () => {
    const data = {
      analytics: analyticsData,
      exportDate: new Date().toISOString(),
      timeRange: `${timeRange} days`
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monstermen-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading analytics...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs">
              {analyticsData.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={analyticsData.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analyticsData.revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
            <div className="flex items-center space-x-1 text-xs">
              {analyticsData.orderGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={analyticsData.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analyticsData.orderGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active catalog items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.users?.full_name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.total_amount}</p>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current order pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.orderStatusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize">{status}</span>
                      <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Products ranked by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{product.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{category.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Type Distribution</CardTitle>
                <CardDescription>Customer segmentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.userTypeDistribution).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type}s</span>
                      <Badge variant={type === 'wholeseller' ? 'default' : 'secondary'}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Automated recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700">Recommendation</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Consider promoting your top-selling products to increase revenue by 15-20%
                  </p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700">Opportunity</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Wholeseller segment shows 40% higher average order value
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-700">Alert</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    Monitor inventory for top-performing products
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}