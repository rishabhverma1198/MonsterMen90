# 🔧 Admin User Setup Guide

## Issue: Admin Login Not Working

If you're seeing "admin panel login nahi ho pa raha" (admin panel login not working), follow these steps to create an admin user:

## Solution Steps

### Step 1: Create Admin User in Supabase

1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add user" 
3. Enter these credentials:
   - **Email**: `admin@example.com`
   - **Password**: `admin123456` (or your preferred password)
   - **Confirm password**: `admin123456`

### Step 2: Add Admin Record to Database

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL query:

```sql
-- Insert admin user record
INSERT INTO users (id, email, full_name, user_type, phone, is_active, created_at, updated_at)
VALUES (
  -- Use the UUID from Step 1 (copy from Supabase Auth users list)
  'YOUR_USER_UUID_FROM_STEP_1',
  'admin@example.com',
  'System Administrator',
  'admin',
  '+91-9876543210',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

### Step 3: Test Admin Login

1. Go to: `http://localhost:5173/admin/login`
2. Login with:
   - **Email**: `admin@example.com`
   - **Password**: `admin123456`

## Quick Admin Creation Script

If you prefer to do this programmatically, you can use this script:

```javascript
// Run this in your browser console (after logging into Supabase as admin)
import { supabase } from './src/lib/supabase';

// Create admin user
const createAdminUser = async () => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123456'
    });
    
    if (authError) throw authError;
    
    // 2. Add to users table
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@example.com',
        full_name: 'System Administrator',
        user_type: 'admin',
        phone: '+91-9876543210',
        is_active: true
      });
      
    if (dbError) throw dbError;
    
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// Run the function
createAdminUser();
```

## Troubleshooting

### If login still doesn't work:

1. **Check user_type in database**: Make sure the users table has `user_type = 'admin'`
2. **Check is_active**: Make sure `is_active = true`
3. **Check Supabase Auth**: Verify the user exists in Authentication → Users
4. **Check console errors**: Look for any JavaScript errors in browser console

### Common Error Messages:

- **"Access denied"**: User doesn't have `user_type = 'admin'` in database
- **"Account inactive"**: User has `is_active = false` in database  
- **"Invalid credentials"**: Wrong email/password combination
- **"User not found"**: User exists in Auth but not in users table

## Admin Features Available

Once logged in, you can access:

- 📊 **Dashboard** - Overview and KPIs
- 📦 **Products** - Manage product catalog
- 🛒 **Orders** - Process and track orders
- 👥 **Users** - Customer management
- 📁 **Categories** - Product categorization
- 📈 **Inventory** - Stock management
- 🎁 **Discounts** - Coupon codes
- 💰 **Pricing** - Price management
- 📊 **Analytics** - Reports and insights

## Security Notes

- The admin password should be changed after first login
- Only users with `user_type = 'admin'` can access admin features
- Admin sessions are automatically managed by Supabase
- All admin actions are logged for security

---

**Need help?** Check the browser console for any error messages and ensure both Supabase Auth and database records are properly set up.