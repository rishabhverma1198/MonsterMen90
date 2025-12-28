# useAdminPlatform Hook - Complete Integration Guide

## 📁 File Placement

The `useAdminPlatform` hook has been successfully integrated into your MonsterMen90 project:

```
MonsterFrontend/src/
├─ hooks/
│   └─ useAdminPlatform.ts      ✅ CREATED
└─ components/admin/
    └─ AdminDashboard.tsx       ✅ EXAMPLE COMPONENT CREATED
```

## 🧩 Usage in Admin Dashboard

### Basic Import and Usage

```tsx
import { useAdminPlatform } from "@/hooks/useAdminPlatform";

const AdminDashboard = () => {
  const {
    orders,
    inventoryAlerts,
    analytics,
    kpis,
    realtimeHealthy,
    userRole,
    storeId
  } = useAdminPlatform();

  // Your component logic here
  return (
    <div>
      {/* UI components using the hook data */}
    </div>
  );
};
```

## 📊 Data Structure Overview

### Return Values from Hook

| Property | Type | Description |
|----------|------|-------------|
| `userRole` | `string \| null` | Admin role: `super_admin` \| `store_admin` \| `staff` |
| `storeId` | `string \| null` | Current user's store ID for data isolation |
| `orders` | `any[]` | Array of orders for the current store |
| `inventoryAlerts` | `any[]` | Low stock inventory items requiring attention |
| `analytics` | `any[]` | Daily sales data for charts and reporting |
| `kpis` | `object` | Key Performance Indicators |
| `realtimeHealthy` | `boolean` | Realtime connection health indicator |

### KPIs Object Structure

```typescript
kpis: {
  totalOrders: number,      // Total number of orders
  totalRevenue: number,     // Sum of all order amounts
  lowStockCount: number     // Count of low stock items
}
```

## 🎨 UI Implementation Examples

### 1. Realtime Health Indicator (🟢 / 🔴)

```tsx
<div className="flex items-center space-x-2">
  <span className="text-sm text-gray-600">Connection</span>
  <div className={`w-3 h-3 rounded-full ${
    realtimeHealthy ? 'bg-green-500' : 'bg-red-500'
  }`} />
</div>
```

### 2. KPI Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
    <p className="text-3xl font-bold text-blue-600">{kpis.totalOrders}</p>
  </div>
  
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
    <p className="text-3xl font-bold text-green-600">
      ${kpis.totalRevenue.toLocaleString()}
    </p>
  </div>
  
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold text-gray-700">Low Stock Items</h3>
    <p className="text-3xl font-bold text-red-600">{kpis.lowStockCount}</p>
  </div>
</div>
```

### 3. Inventory Alerts List

```tsx
{inventoryAlerts.length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      Low Stock Alerts ({inventoryAlerts.length})
    </h3>
    <div className="space-y-2">
      {inventoryAlerts.map((alert, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-red-700">
            {alert.name || alert.product_name}
          </span>
          <span className="text-red-600 font-medium">
            Stock: {alert.quantity}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

### 4. Recent Orders Display

```tsx
<div className="bg-white rounded-lg shadow">
  <div className="p-6 border-b border-gray-200">
    <h3 className="text-lg font-semibold">Recent Orders</h3>
  </div>
  <div className="p-6">
    {orders.length === 0 ? (
      <p className="text-gray-500 text-center py-4">No orders found</p>
    ) : (
      <div className="space-y-4">
        {orders.slice(0, 10).map((order, index) => (
          <div key={order.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Order #{order.id}</p>
              <p className="text-sm text-gray-600">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">
                ${order.total_amount?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">
                {order.status || 'pending'}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

### 5. Analytics Chart Data

```tsx
<div className="bg-white rounded-lg shadow">
  <div className="p-6 border-b border-gray-200">
    <h3 className="text-lg font-semibold">Sales Analytics</h3>
  </div>
  <div className="p-6">
    {analytics.length === 0 ? (
      <p className="text-gray-500 text-center py-4">
        No analytics data available
      </p>
    ) : (
      <div className="space-y-2">
        {analytics.slice(0, 7).map((day, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {new Date(day.day).toLocaleDateString()}
            </span>
            <span className="font-medium">
              ${day.total_sales?.toLocaleString() || 0}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

## 🔄 Realtime Features

The hook automatically handles:

1. **Realtime Order Updates** - Orders are refreshed when new orders are created
2. **Inventory Change Detection** - Low stock alerts update when inventory changes
3. **Fallback Mechanism** - If realtime fails, data is refreshed every 5 seconds
4. **Health Monitoring** - Connection health is tracked and displayed

## 🏗️ Required Database Tables

Make sure these tables exist in your Supabase database:

1. **`admin_users`** - Admin user roles and store associations
2. **`orders`** - Order data with store_id foreign key
3. **`inventory`** - Product inventory with low_stock boolean flag
4. **`daily_sales`** - Daily sales analytics data

## 🛡️ Security Features

- **Multi-store Isolation**: All queries are filtered by `store_id`
- **Role-based Access**: User role determines available features
- **Admin Context Loading**: Automatically loads user permissions on mount

## 🚀 Complete Admin Dashboard Example

See the example component at:
- **File**: `MonsterFrontend/src/components/admin/AdminDashboard.tsx`
- **Features**: Complete dashboard with all hook integrations
- **UI**: Tailwind CSS styling with responsive design

## 💡 Integration Tips

1. **Route Protection**: Use with your existing admin route guards
2. **Loading States**: Consider adding loading states while `userRole` is null
3. **Error Handling**: The hook gracefully handles missing Supabase configuration
4. **Performance**: Data is cached and only refreshed when necessary
5. **Mobile Responsive**: All components are mobile-friendly

## 🔧 Customization Options

You can easily extend the hook by:

1. **Adding new data fetchers** for additional admin features
2. **Modifying KPI calculations** to match your business logic
3. **Adding new realtime channels** for other data types
4. **Extending the admin context** with additional user permissions

The hook is designed to be flexible and easily customizable for your specific admin needs.