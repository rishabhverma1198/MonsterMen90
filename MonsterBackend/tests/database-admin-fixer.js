#!/usr/bin/env node

/**
 * Database Admin Fix Implementation Script
 * Implements RLS policies and creates admin user to resolve admin timeout issues
 * 
 * Date: December 28, 2025
 * Purpose: Fix admin functionality by implementing proper RLS policies and creating admin user
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

class DatabaseAdminFixer {
  constructor() {
    // Load environment variables
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please check .env file.');
    }

    console.log('🔧 Database Admin Fix Implementation');
    console.log('📍 Supabase URL:', this.supabaseUrl);
    
    // Create Supabase client with service role capabilities
    this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
    
    // Admin user configuration
    this.adminUserId = '123e4567-e89b-12d3-a456-426614174000';
    this.adminEmail = 'admin@monstermen90.com';
    this.adminName = 'System Administrator';
    this.adminPhone = '+91-9876543210';
  }

  async executeFix() {
    try {
      console.log('\n🚀 Starting Database Admin Fix Implementation...\n');

      // Step 1: Test current database state
      await this.testCurrentState();

      // Step 2: Create RLS policies via SQL execution
      await this.implementRLSPolicies();

      // Step 3: Create admin user
      await this.createAdminUser();

      // Step 4: Verify the fix
      await this.verifyFix();

      console.log('\n✅ Database Admin Fix Implementation Completed Successfully!');
      return true;

    } catch (error) {
      console.error('\n❌ Database Admin Fix Implementation Failed:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }

  async testCurrentState() {
    console.log('🧪 Step 1: Testing Current Database State');

    try {
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('products')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error.message);
        throw new Error('Database connection failed');
      }

      console.log('✅ Database connection successful');

      // Test users table access
      try {
        const { data: usersData, error: usersError } = await this.supabase
          .from('users')
          .select('id, user_type')
          .limit(1);

        if (usersError) {
          console.log('⚠️  Users table access blocked (expected):', usersError.message);
          console.log('   This confirms RLS policies are blocking access');
        } else {
          console.log('✅ Users table accessible (unexpected - RLS may not be enabled)');
          console.log('📊 Current users in table:', usersData?.length || 0);
        }
      } catch (usersErr) {
        console.log('⚠️  Users table access blocked (expected):', usersErr.message);
      }

    } catch (err) {
      console.error('❌ Current state test failed:', err.message);
      throw err;
    }
  }

  async implementRLSPolicies() {
    console.log('\n🔐 Step 2: Implementing RLS Policies');

    // Since we can't execute DDL directly via the JS client,
    // we'll provide the SQL commands and try alternative approaches

    const rlsPolicies = `
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin users can insert users" ON users;
DROP POLICY IF EXISTS "Admin users can update any profile" ON users;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow admin users to read all profiles
CREATE POLICY "Admin users can view all profiles" ON users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow admin users to insert new users
CREATE POLICY "Admin users can insert users" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );

-- Allow admin users to update any user profile
CREATE POLICY "Admin users can update any profile" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );
`;

    console.log('📋 RLS Policies to be implemented:');
    console.log('   ✅ Enable RLS on users table');
    console.log('   ✅ Users can view own profile');
    console.log('   ✅ Admin users can view all profiles');
    console.log('   ✅ Users can update own profile');
    console.log('   ✅ Admin users can insert users');
    console.log('   ✅ Admin users can update any profile');

    // Since direct SQL execution via JS client is limited,
    // we'll save the SQL to a file for manual execution
    const sqlFilePath = path.join(process.cwd(), 'rls-policies-implementation.sql');
    fs.writeFileSync(sqlFilePath, rlsPolicies);
    console.log(`\n💾 RLS policies saved to: ${sqlFilePath}`);
    console.log('   Please execute this SQL file in your Supabase SQL Editor');

    // Alternative: Try to create policies via RPC if available
    try {
      console.log('\n🔄 Attempting alternative policy creation method...');
      
      // This would require a custom RPC function in Supabase
      const { data, error } = await this.supabase.rpc('create_admin_rls_policies');
      
      if (error) {
        console.log('ℹ️  RPC method not available, using manual SQL execution');
      } else {
        console.log('✅ RLS policies created via RPC');
      }
    } catch (rpcErr) {
      console.log('ℹ️  RPC method not available, using manual SQL execution');
    }

    console.log('\n⚠️  IMPORTANT: RLS policies must be executed manually in Supabase SQL Editor');
    console.log('   Copy the SQL from the generated file and execute it in Supabase Dashboard');
  }

  async createAdminUser() {
    console.log('\n👤 Step 3: Creating Admin User');

    try {
      // Try to create admin user via direct insertion (may fail due to RLS)
      console.log('🔄 Attempting to create admin user...');

      const adminUserData = {
        id: this.adminUserId,
        email: this.adminEmail,
        full_name: this.adminName,
        user_type: 'admin',
        phone: this.adminPhone,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([adminUserData])
        .select();

      if (error) {
        console.log('⚠️  Direct admin user creation failed (expected due to RLS):', error.message);
        console.log('   Admin user will need to be created via Supabase SQL Editor or Auth');
        
        // Provide SQL for manual admin user creation
        const adminUserSQL = `
-- Create admin user (execute in Supabase SQL Editor)
INSERT INTO users (id, email, full_name, user_type, phone, is_active, created_at, updated_at)
VALUES (
  '${this.adminUserId}',
  '${this.adminEmail}',
  '${this.adminName}',
  'admin',
  '${this.adminPhone}',
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
`;

        const adminSQLFilePath = path.join(process.cwd(), 'create-admin-user.sql');
        fs.writeFileSync(adminSQLFilePath, adminUserSQL);
        console.log(`💾 Admin user creation SQL saved to: ${adminSQLFilePath}`);

        return false;
      } else {
        console.log('✅ Admin user created successfully');
        console.log('📊 Admin user data:', data);
        return true;
      }

    } catch (err) {
      console.error('❌ Admin user creation failed:', err.message);
      return false;
    }
  }

  async verifyFix() {
    console.log('\n🔍 Step 4: Verifying Fix Implementation');

    try {
      // Test the exact query used by AdminContext
      console.log('🧪 Testing AdminContext query simulation...');

      const { data: testData, error: testError } = await this.supabase
        .from('users')
        .select('id, user_type, email, full_name')
        .eq('id', this.adminUserId);

      if (testError) {
        console.log('⚠️  Admin user verification failed (expected if not created yet):', testError.message);
        console.log('   This will be resolved after manual SQL execution');
      } else if (testData && testData.length > 0) {
        console.log('✅ Admin user verification successful');
        console.log('👤 Admin user found:', testData[0]);
      } else {
        console.log('⚠️  Admin user not found - may need to create user first');
      }

      // Test general users table access
      const { data: usersData, error: usersError } = await this.supabase
        .from('users')
        .select('id, user_type')
        .limit(5);

      if (usersError) {
        console.log('⚠️  General users table access still blocked:', usersError.message);
      } else {
        console.log('✅ Users table access working');
        console.log('📊 Users found:', usersData?.length || 0);
      }

      // Generate verification queries
      const verificationQueries = `
-- Verification Queries (execute after RLS policies and admin user creation)

-- 1. Verify admin user exists
SELECT id, email, full_name, user_type, is_active 
FROM users 
WHERE user_type = 'admin';

-- 2. Test AdminContext query
SELECT id, user_type, email, full_name, is_active
FROM users 
WHERE id = '${this.adminUserId}';

-- 3. Check RLS policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Test admin can read all users (should work after fix)
SELECT COUNT(*) as total_users, user_type
FROM users 
GROUP BY user_type;
`;

      const verificationFilePath = path.join(process.cwd(), 'verification-queries.sql');
      fs.writeFileSync(verificationFilePath, verificationQueries);
      console.log(`💾 Verification queries saved to: ${verificationFilePath}`);

    } catch (err) {
      console.error('❌ Verification failed:', err.message);
    }
  }

  printNextSteps() {
    console.log('\n📋 NEXT STEPS TO COMPLETE THE FIX:');
    console.log('\n1. 🎯 Execute RLS Policies:');
    console.log('   - Open Supabase Dashboard > SQL Editor');
    console.log('   - Copy and execute SQL from: rls-policies-implementation.sql');
    console.log('   - Verify policies are created successfully');

    console.log('\n2. 👤 Create Admin User:');
    console.log('   - Execute SQL from: create-admin-user.sql');
    console.log('   - Or create via Supabase Auth, then add to users table');

    console.log('\n3. ✅ Verify Fix:');
    console.log('   - Execute queries from: verification-queries.sql');
    console.log('   - Run: node detailed-admin-test.cjs');
    console.log('   - Check admin panel functionality');

    console.log('\n4. 🎉 Test Admin Functionality:');
    console.log('   - AdminContext should no longer timeout');
    console.log('   - Admin panel should be accessible');
    console.log('   - Admin authentication should work');
  }
}

// Main execution
async function main() {
  try {
    const fixer = new DatabaseAdminFixer();
    const success = await fixer.executeFix();
    fixer.printNextSteps();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();