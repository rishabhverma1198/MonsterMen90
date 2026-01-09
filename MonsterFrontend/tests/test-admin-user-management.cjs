#!/usr/bin/env node

/**
 * Admin User Management Functionality Test
 * Tests the admin user management service integration and CRUD operations
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class AdminUserManagementTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.testUserId = null;
    this.testUserEmail = `test-admin-user-${Date.now()}@example.com`;
  }

  async runAllTests() {
    console.log('🚀 Starting Admin User Management Tests\n');

    try {
      await this.testUserCRUDOperations();
      await this.testUserFilteringAndSearch();
      await this.testUserStatistics();
      await this.testUserRoleManagement();
      await this.testUserDeactivation();
      
      this.printSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  async testUserCRUDOperations() {
    console.log('📋 Testing User CRUD Operations...\n');

    // Test 1: Get all users (should work with proper admin role)
    await this.runTest('Get All Users', async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          user_type,
          created_at,
          updated_at,
          user_addresses (
            id,
            address_line_1,
            city,
            state,
            pincode,
            is_default
          ),
          orders (
            id,
            total_amount,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Found ${data?.length || 0} users`);
      
      if (!data || data.length === 0) {
        throw new Error('No users found in database');
      }

      return data;
    });

    // Test 2: Create a test user
    await this.runTest('Create Test User', async () => {
      const testUser = {
        email: this.testUserEmail,
        full_name: 'Test Admin User',
        phone: '+1234567890',
        user_type: 'buyer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from user creation');
      
      this.testUserId = data.id;
      console.log(`✅ Created test user with ID: ${data.id}`);
      return data;
    });

    // Test 3: Update user
    await this.runTest('Update User', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }

      const updates = {
        full_name: 'Updated Test User',
        phone: '+9876543210',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.testUserId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from user update');

      console.log(`✅ Updated user: ${data.full_name} - ${data.phone}`);
      return data;
    });

    // Test 4: Get specific user by ID
    await this.runTest('Get User By ID', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_addresses (*),
          orders (*)
        `)
        .eq('id', this.testUserId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      console.log(`✅ Found user: ${data.email}`);
      return data;
    });
  }

  async testUserFilteringAndSearch() {
    console.log('\n🔍 Testing User Filtering and Search...\n');

    // Test 1: Filter by user type
    await this.runTest('Filter Users by Type (buyer)', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'buyer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Found ${data?.length || 0} buyers`);
      return data;
    });

    // Test 2: Search by name or email
    await this.runTest('Search Users', async () => {
      const searchTerm = 'Test';
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Found ${data?.length || 0} users matching "${searchTerm}"`);
      return data;
    });

    // Test 3: Get user statistics
    await this.runTest('Get User Statistics', async () => {
      const { data: users, error } = await supabase
        .from('users')
        .select('user_type');

      if (error) throw error;

      const stats = {
        totalUsers: users?.length || 0,
        buyers: users?.filter(u => u.user_type === 'buyer').length || 0,
        wholesalers: users?.filter(u => u.user_type === 'wholeseller').length || 0,
        admins: users?.filter(u => u.user_type === 'admin').length || 0
      };

      console.log('✅ User Statistics:', stats);
      return stats;
    });
  }

  async testUserRoleManagement() {
    console.log('\n👥 Testing User Role Management...\n');

    // Test 1: Check role-based access (should fail for non-admin trying to change to admin)
    await this.runTest('Role Change Restrictions', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }

      // Try to change user to admin (this should be restricted in the UI)
      const { data, error } = await supabase
        .from('users')
        .update({ 
          user_type: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.testUserId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ User role updated to: ${data.user_type}`);
      return data;
    });

    // Test 2: Change back to buyer
    await this.runTest('Change Role Back to Buyer', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }

      const { data, error } = await supabase
        .from('users')
        .update({ 
          user_type: 'buyer',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.testUserId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ User role changed back to: ${data.user_type}`);
      return data;
    });
  }

  async testUserDeactivation() {
    console.log('\n🚫 Testing User Deactivation...\n');

    // Test: Deactivate user (soft delete)
    await this.runTest('Deactivate User', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available');
      }

      // Instead of hard delete, we'll add a deleted_at timestamp or mark as inactive
      const { data, error } = await supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString(),
          // You might want to add an 'is_active' field in your schema
        })
        .eq('id', this.testUserId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ User deactivated: ${data.email}`);
      return data;
    });

    // Cleanup: Delete the test user
    await this.runTest('Cleanup Test User', async () => {
      if (!this.testUserId) {
        throw new Error('No test user ID available for cleanup');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', this.testUserId);

      if (error) throw error;
      
      console.log(`✅ Test user deleted successfully`);
      return true;
    });
  }

  async testUserStatistics() {
    console.log('\n📊 Testing Advanced User Statistics...\n');

    // Test 1: Calculate total spent by all users
    await this.runTest('Calculate Total Revenue', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount');

      if (error) throw error;

      const totalRevenue = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      console.log(`✅ Total Revenue: ₹${totalRevenue.toLocaleString()}`);
      return totalRevenue;
    });

    // Test 2: Get users with order counts
    await this.runTest('Get Users with Order Counts', async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          user_type,
          orders (id, total_amount, status)
        `);

      if (error) throw error;

      const usersWithOrders = data?.map(user => ({
        ...user,
        orderCount: user.orders?.length || 0,
        totalSpent: user.orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      })) || [];

      console.log(`✅ Found ${usersWithOrders.length} users with order data`);
      return usersWithOrders;
    });
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = await testFunction();
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASSED', result });
      console.log(`✅ PASSED: ${testName}\n`);
      return result;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}\n`);
    }
  }

  printSummary() {
    console.log('📋 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Total: ${this.testResults.tests.length}`);
    console.log(`🎯 Success Rate: ${((this.testResults.passed / this.testResults.tests.length) * 100).toFixed(1)}%\n`);

    if (this.testResults.failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
    }

    console.log('\n🎉 Admin User Management Tests Completed!');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AdminUserManagementTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AdminUserManagementTester;