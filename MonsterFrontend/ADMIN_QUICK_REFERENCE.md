# Admin Panel - Quick Reference

## 🚀 Getting Started (30 seconds)

### 1. Start the dev server
```bash
npm run dev
```

### 2. Go to admin login
```
http://localhost:5173/admin/login
```

### 3. Login with your admin credentials
```
Email: admin@example.com
Password: your_password
```

---

## 📍 Main Admin Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/admin/login` | Admin login page | ✅ Ready |
| `/admin/dashboard` | Main dashboard with KPIs | ✅ Ready |
| `/admin/products` | Product management | ✅ Ready |
| `/admin/orders` | Order management | ✅ Ready |
| `/admin/users` | User management | ✅ Ready |
| `/admin/categories` | Category management | ✅ Ready |
| `/admin/inventory` | Inventory tracking | ✅ Ready |
| `/admin/discounts` | Discount codes | ✅ Ready |
| `/admin/pricing` | Price management | ✅ Ready |
| `/admin/analytics` | Reports & analytics | ✅ Ready |

---

## 🛠️ Common Operations

### Create a Product
```typescript
import { productService } from '@/lib/services/admin.service';

await productService.createProduct({
  name: 'T-Shirt',
  slug: 't-shirt',
  description: 'Cotton t-shirt',
  sku: 'TSH001',
  category_id: 'uuid-here',
  base_price: 299,
  is_active: true
});
```

### Update Inventory
```typescript
import { inventoryService } from '@/lib/services/admin.service';

await inventoryService.updateVariantStock('variant-id', 50);
```

### Create Discount
```typescript
import { discountService } from '@/lib/services/admin.service';

await discountService.createDiscount({
  code: 'SAVE20',
  type: 'percentage',
  value: 20,
  min_purchase: 500,
  valid_from: new Date(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
});
```

### Update Order Status
```typescript
import { orderService } from '@/lib/services/admin.service';

await orderService.updateOrderStatus('order-id', 'shipped');
```

### Get Dashboard Stats
```typescript
import { analyticsService } from '@/lib/services/admin.service';

const revenue = await analyticsService.getRevenueData(30);
const topProducts = await analyticsService.getTopProducts(10);
const metrics = await analyticsService.getCustomerMetrics();
```

---

## 🔧 Admin Context Usage

```typescript
import { useAdmin } from '@/context/AdminContext';

function AdminComponent() {
  const { admin, isAdmin, loading, logout, checkAdminAccess } = useAdmin();

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" />;

  return (
    <div>
      <h1>Welcome {admin?.full_name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 📊 Dashboard KPIs

The dashboard displays:
- **Total Orders** - Sum of all orders
- **Total Revenue** - Revenue from completed orders
- **Total Products** - Count of active products
- **Total Users** - Count of buyer accounts
- **Pending Orders** - Orders awaiting processing
- **Low Stock Items** - Items below min threshold

---

## 🎨 Admin Layout Components

### AdminLayout Props
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;        // Default: 'Admin'
  adminEmail?: string;       // Default: 'admin@example.com'
}
```

### Usage
```tsx
import AdminLayout from '@/components/admin/AdminLayout';

<AdminLayout adminName="John Doe" adminEmail="john@example.com">
  <YourContent />
</AdminLayout>
```

---

## 🔐 Protected Routes

### Create Protected Route
```tsx
import AdminProtectedRoute from '@/routes/AdminProtectedRoute';

<Route path="/admin/products" element={
  <AdminProtectedRoute>
    <AdminProductManagement />
  </AdminProtectedRoute>
} />
```

### Redirect to Login
- Automatically redirects if not authenticated
- Checks admin role in database
- Shows loading spinner during verification

---

## 💾 Database Setup

### Apply Migrations
```bash
# Open Supabase SQL Editor and run:
supabase/migrations/002_admin_features.sql
```

### Create Admin User
```sql
INSERT INTO users (email, full_name, user_type, is_active)
VALUES ('admin@example.com', 'Admin User', 'admin', true);
```

### Check Existing Users
```sql
SELECT id, email, full_name, user_type FROM users 
WHERE user_type = 'admin';
```

---

## 🧪 Testing Features

### Test Login
1. Go to `/admin/login`
2. Enter admin email & password
3. Should redirect to `/admin/dashboard`

### Test Protected Routes
1. Try to access `/admin/products` without login
2. Should redirect to `/admin/login`

### Test Dashboard Stats
1. Check if KPI cards load data
2. Verify numbers are correct
3. Test filters and search

### Test Inventory
1. Try to update stock levels
2. Test search and filter
3. Check low stock alerts

### Test Discounts
1. Create a discount code
2. Edit the code
3. Delete the code
4. Verify in database

### Test Pricing
1. Update product prices
2. Check margin calculations
3. Verify wholesale pricing

---

## 📱 Responsive Breakpoints

Admin layout is responsive:
- **Desktop** (1024px+): Full sidebar
- **Tablet** (768-1023px): Collapsed sidebar
- **Mobile** (<768px): Hidden sidebar, menu button

---

## 🎯 Keyboard Shortcuts

- `ESC` - Close dialogs/modals
- `Ctrl+K` / `Cmd+K` - Search (when implemented)
- `Ctrl+S` / `Cmd+S` - Save form (depends on form)

---

## 🐛 Debugging Tips

### Enable Console Logging
```typescript
// Add to admin.service.ts
console.log('Service called:', methodName, params);
console.log('Response:', data, error);
```

### Check Supabase Connection
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.from('users').select().limit(1);
console.log('Connection:', data ? 'OK' : 'FAILED', error);
```

### Verify Admin Status
```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('user_type')
  .eq('id', user?.id)
  .single();
console.log('Admin?', profile?.user_type === 'admin');
```

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 📊 Data Models

### Product Model
```typescript
{
  id: UUID
  name: string
  slug: string
  description: string
  category_id: UUID
  base_price: number
  wholesale_price?: number
  cost_price?: number
  images: string[]
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### Discount Model
```typescript
{
  id: UUID
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase?: number
  max_uses?: number
  used_count: number
  valid_from: timestamp
  valid_until: timestamp
  is_active: boolean
}
```

### Order Model
```typescript
{
  id: UUID
  user_id: UUID
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🌐 Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📚 File Reference

### Core Files
- `src/context/AdminContext.tsx` - Auth context
- `src/components/admin/AdminLayout.tsx` - Layout wrapper
- `src/routes/AdminProtectedRoute.tsx` - Route protection
- `src/lib/services/admin.service.ts` - API services

### Pages
- `src/pages/admin/AdminLogin.tsx` - Login page
- `src/pages/admin/AdminDashboardEnhanced.tsx` - Dashboard
- `src/pages/admin/AdminProductManagement.tsx` - Products
- `src/pages/admin/AdminOrderManagement.tsx` - Orders
- `src/pages/admin/AdminUserManagement.tsx` - Users
- `src/pages/admin/AdminCategoryManagement.tsx` - Categories
- `src/pages/admin/AdminInventoryManagement.tsx` - Inventory
- `src/pages/admin/AdminDiscountManagement.tsx` - Discounts
- `src/pages/admin/AdminPricingManagement.tsx` - Pricing
- `src/pages/admin/AdminAnalytics.tsx` - Analytics

### Documentation
- `ADMIN_PANEL_PLAN.md` - Project plan
- `ADMIN_IMPLEMENTATION_GUIDE.md` - Setup guide
- `ADMIN_SUMMARY.md` - Overview
- `ADMIN_COMPLETION_REPORT.md` - Detailed report

---

## 🆘 Support

### Having issues?

1. **Check the console** - Look for error messages
2. **Verify admin status** - Ensure user has `user_type = 'admin'`
3. **Check Supabase** - Verify database connection
4. **Review logs** - Check admin activity logs
5. **Read docs** - Refer to documentation files

---

## 📞 Useful Links

- **Supabase Dashboard**: https://app.supabase.com
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

## ✨ Quick Tips

💡 **Pro Tips:**
1. Use browser DevTools to inspect element data
2. Check Supabase logs for query errors
3. Use TypeScript strict mode for type safety
4. Implement proper error boundaries
5. Keep components modular and reusable
6. Use constants for magic numbers
7. Document complex logic with comments
8. Test edge cases before deployment

---

## 🎯 Next Steps

1. ✅ Admin panel is ready
2. 📝 Review documentation
3. 🧪 Test all features
4. 🐛 Fix any issues
5. 🚀 Deploy to production
6. 📊 Monitor performance
7. 🔄 Iterate and improve

---

**Last Updated**: December 19, 2025
**Status**: Production Ready
**Version**: 1.0 Beta
