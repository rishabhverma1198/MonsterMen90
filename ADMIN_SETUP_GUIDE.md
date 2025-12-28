# Admin Panel Setup and Testing Guide

## Overview

This guide will help you set up and test the comprehensive admin panel for MonsterMen90 e-commerce platform. The admin panel now includes:

- ✅ Fixed TypeScript errors
- ✅ Comprehensive database schema
- ✅ Working API endpoints
- ✅ Functional product management
- ✅ Proper field mappings
- ✅ Enhanced admin features

## Database Setup

### 1. Run Database Migrations

Execute the new comprehensive migration to set up all admin features:

```bash
# Navigate to MonsterBackend directory
cd MonsterBackend

# Run the comprehensive admin schema migration
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const connectionString = \`postgresql://postgres:\${serviceKey}@db.\${projectRef}.supabase.co:5432/postgres\`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'MonsterFrontend', 'supabase', 'migrations', '005_admin_comprehensive_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.length > 10) {
        await pool.query(statement);
      }
    }
    
    console.log('✅ Admin schema migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
"
```

### 2. Verify Database Tables

Check that all tables are created correctly:

```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'product_stock', 'order_status_history', 
  'product_media', 'admin_notifications'
);

-- Check if new views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'admin_active_products', 'admin_order_summary', 
  'admin_low_stock_alerts'
);
```

## Backend Setup

### 1. Update Server Routes

The server.js file has been updated to include the new admin product routes. Ensure the routes are properly mounted:

```javascript
// In MonsterBackend/server.js - should already be updated
app.use('/api/admin/products', adminProductsRoutes);
```

### 2. Test API Endpoints

Test the new admin API endpoints:

```bash
# Test getting products
curl -X GET "http://localhost:3001/api/admin/products" \
  -H "Content-Type: application/json"

# Test getting categories
curl -X GET "http://localhost:3001/api/admin/products/categories" \
  -H "Content-Type: application/json"

# Test creating a product (example)
curl -X POST "http://localhost:3001/api/admin/products" \
  -H "Content-Type: application/json" \
  -d '{
    "product_title": "Test Product",
    "category_id": "your-category-id",
    "gender": "Unisex",
    "target_audience": "buyer",
    "base_price": 499,
    "moq": 1,
    "stock_alert_threshold": 10,
    "is_active": true,
    "is_featured": false
  }'
```

## Frontend Setup

### 1. Update Admin Routes

Add the new admin product management page to your routing:

```typescript
// In MonsterFrontend/src/routes/AppRoutes.tsx
import AdminProductManagement from '@/pages/admin/AdminProductManagement';

// Add to your routes
{
  path: '/admin/products',
  element: <AdminProtectedRoute><AdminProductManagement /></AdminProtectedRoute>
}
```

### 2. Test Admin Product Form

The EnhancedProductForm has been completely fixed:

- ✅ Field name mappings corrected
- ✅ Database schema compatibility
- ✅ Proper error handling
- ✅ TypeScript type safety
- ✅ Auto-generated slugs
- ✅ Category integration

### 3. Test Admin Product Management Page

The AdminProductManagement page includes:

- ✅ Product listing with filters
- ✅ Search functionality
- ✅ Create/edit/delete products
- ✅ Status toggling
- ✅ Category management
- ✅ Low stock alerts
- ✅ Responsive design

## Testing the Complete Workflow

### 1. Admin Login

1. Navigate to `/admin/login`
2. Use the admin credentials:
   - Email: `admin@monstermen90.com`
   - Password: `MonsterAdmin2025!`

### 2. Create a Product

1. Go to `/admin/products`
2. Click "Add Product"
3. Fill in the form:
   - Product Title: "Cotton T-Shirt"
   - Category: Select a category
   - Gender: "Men"
   - Target Audience: "Buyer"
   - Base Price: 499
   - MOQ: 1
   - Stock Alert Threshold: 10
4. Click "Save Product"

### 3. Verify Product Creation

1. Check that the product appears in the list
2. Verify the product details are correct
3. Test editing the product
4. Test toggling the product status
5. Test deleting the product

### 4. Test Categories

1. In the product form, test category selection
2. Verify categories load correctly
3. Test sub-category filtering

### 5. Test Filters and Search

1. Use the search box to find products
2. Filter by category
3. Toggle "Active products only"
4. Test the refresh functionality

## Common Issues and Solutions

### Issue: "Field not found" errors
**Solution**: The database schema has been updated. Run the migration script above.

### Issue: "Save button not working"
**Solution**: The form has been completely rewritten with proper field mappings. Ensure you're using the updated EnhancedProductForm.

### Issue: "Categories not loading"
**Solution**: The admin API now includes category endpoints. Check that the routes are properly mounted.

### Issue: "TypeScript errors"
**Solution**: All TypeScript errors have been fixed. Ensure you have the latest type definitions.

## Database Schema Summary

The new comprehensive schema includes:

### Core Tables
- `products` - Enhanced with admin fields
- `product_variants` - Existing with better indexing
- `categories` - Existing with admin features
- `orders` - Existing with status tracking
- `users` - Existing with admin roles

### New Admin Tables
- `product_stock` - Better inventory management
- `order_status_history` - Track order changes
- `product_media` - Enhanced media management
- `admin_notifications` - System notifications

### Admin Views
- `admin_active_products` - Active products summary
- `admin_order_summary` - Order statistics
- `admin_low_stock_alerts` - Low stock items

## API Endpoints Summary

### Admin Product Endpoints
- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:id` - Get single product
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PATCH /api/admin/products/:id/status` - Toggle status

### Admin Category Endpoints
- `GET /api/admin/products/categories` - Get categories
- `POST /api/admin/products/categories` - Create category

### Admin Inventory Endpoints
- `GET /api/admin/products/low-stock` - Get low stock items
- `GET /api/admin/products/:id/variants` - Get product variants
- `PATCH /api/admin/products/variants/:id/stock` - Update stock

## Next Steps

1. **Test thoroughly**: Go through all the workflows described above
2. **Customize**: Modify the admin panel to match your specific needs
3. **Add more features**: Use the existing patterns to add more admin functionality
4. **Monitor**: Use the performance monitoring endpoints to track usage

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify your Supabase credentials are set
3. Ensure the database migrations ran successfully
4. Check the API endpoints are responding
5. Review the TypeScript compilation for any remaining errors

The admin panel is now fully functional with a comprehensive database schema and working API endpoints!