# Supabase Setup Guide for MonsterMen90

## 🚀 Quick Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Initialize Supabase Project
```bash
supabase init
supabase start
```

### 3. Setup Database
```bash
supabase db reset
# Or manually run the migration:
supabase db push
```

### 4. Environment Variables
Create `.env.local` file:
```env
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# For production (replace with your actual values)
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 5. Get Your Keys
After running `supabase start`, check the output for:
- API URL (anon key)
- Studio URL
- Inbucket URL

## 📁 Project Structure
```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   └── 001_initial_schema.sql
├── functions/               # Edge functions
└── seed.sql                 # Sample data (optional)
```

## 🔐 Authentication Setup

### Enable Authentication Providers
1. Go to Supabase Dashboard → Authentication → Settings
2. Enable Email authentication
3. Configure site URL: `http://localhost:3000` (development) or your production URL

### User Type Field
The database includes a `user_type` field with three values:
- `buyer` - Regular customers
- `wholeseller` - Bulk buyers with special pricing
- `admin` - Platform administrators

## 🗄️ Database Schema Overview

### Core Tables
- **users** - User accounts with type
- **categories** - Product categories
- **products** - Product catalog
- **product_variants** - Size/color variations
- **orders** - Order management
- **order_items** - Order line items
- **payments** - Payment records
- **user_addresses** - Shipping addresses

### Key Features
- Auto-generated order numbers
- Stock tracking with transactions
- User roles and permissions
- Product reviews and ratings
- Wishlist functionality
- Coupon/discount system

## 🛠️ Development Commands

### Start Local Supabase
```bash
supabase start
```

### Stop Supabase
```bash
supabase stop
```

### Reset Database
```bash
supabase db reset
```

### Generate New Migration
```bash
supabase migration new your_migration_name
```

### Deploy to Production
```bash
supabase db push
```

## 📊 Row Level Security (RLS)

The database is configured with RLS for security:

### Users Table
- Users can only read their own data
- Admins can read all user data

### Products Table
- Public read access for active products
- Admin write access

### Orders Table
- Users can only access their own orders
- Admins can access all orders

## 🔄 Real-time Features

Supabase provides real-time subscriptions for:
- Order status updates
- Inventory changes
- New product notifications
- User activity

## 🖼️ File Storage

### Storage Buckets
Create these buckets in Supabase Storage:
- `product-images` - Product photos
- `category-images` - Category images
- `user-avatars` - User profile pictures

### Storage Policies
- Public read for product images
- Authenticated upload for admins
- User-only access for avatars

## 📈 Analytics & Monitoring

### Built-in Analytics
- User registration tracking
- Order volume monitoring
- Product view analytics

### Custom Analytics
Create views for:
- Daily sales reports
- Top-selling products
- Customer lifetime value
- Inventory turnover

## 🚀 Production Deployment

### 1. Create Production Project
```bash
supabase projects create monstermens90-production
```

### 2. Link to Production
```bash
supabase link --project-ref your-project-ref
```

### 3. Deploy Schema
```bash
supabase db push
```

### 4. Deploy Functions
```bash
supabase functions deploy
```

## 🔧 Environment-Specific Configurations

### Development
- Local Supabase instance
- Debug logging enabled
- CORS enabled for localhost

### Production
- Managed Supabase instance
- Production API keys
- Optimized performance settings
- Enhanced security policies

## 📝 Common Tasks

### Add New Product Category
```sql
INSERT INTO categories (name, slug, description) 
VALUES ('New Category', 'new-category', 'Description here');
```

### Create Admin User
```sql
INSERT INTO users (email, full_name, user_type) 
VALUES ('admin@monstermens90.com', 'Admin User', 'admin');
```

### Update Product Stock
```sql
UPDATE product_variants 
SET stock_quantity = 50 
WHERE product_id = 'product-uuid' AND size = 'M';
```

### Generate Sales Report
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue
FROM orders 
WHERE status = 'delivered' 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

## 🐛 Troubleshooting

### Connection Issues
- Check if Supabase is running: `supabase status`
- Verify environment variables
- Ensure correct port numbers

### Migration Errors
- Check SQL syntax
- Verify table relationships
- Run `supabase db reset` to start fresh

### Authentication Problems
- Verify site URL configuration
- Check email confirmation settings
- Ensure proper redirect URLs

## 📞 Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

This setup provides a solid foundation for your production-ready ecommerce platform with all the features needed for a modern online clothing business.