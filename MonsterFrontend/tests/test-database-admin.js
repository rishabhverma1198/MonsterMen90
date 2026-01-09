/**
 * Database Admin Verification Test
 * This script tests the database connectivity and verifies admin functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Starting Database Admin Verification Test...\n');

  // Get Supabase configuration
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    return false;
  }

  console.log('✅ Environment variables found');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Basic connectivity
    console.log('\n🧪 Test 1: Basic Database Connectivity');
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('   Error details:', error);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test 2: Check users table structure
    console.log('\n🧪 Test 2: Users Table Structure');
    try {
      const { data: usersTable, error: usersError } = await supabase
        .from('users')
        .select('id, user_type')
        .limit(1);

      if (usersError) {
        console.error('❌ Users table query failed:', usersError.message);
        console.error('   This could mean:');
        console.error('   - Users table does not exist');
        console.error('   - RLS policies are blocking access');
        console.error('   - User does not have proper permissions');
        return false;
      }

      console.log('✅ Users table accessible');
      console.log(`📊 Current users in table: ${usersTable?.length || 0}`);

    } catch (usersErr) {
      console.error('❌ Users table access error:', usersErr.message);
      console.error('   This suggests the users table may not exist or is not accessible');
      return false;
    }

    // Test 3: Check all available tables
    console.log('\n🧪 Test 3: Available Tables');
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_schema_info');

      if (tablesError) {
        console.log('ℹ️  Schema info RPC not available, trying direct table queries...');
        
        // Try to query common tables
        const commonTables = ['products', 'categories', 'orders', 'users', 'profiles'];
        const availableTables = [];
        
        for (const table of commonTables) {
          try {
            const { error: tableError } = await supabase
              .from(table)
              .select('count')
              .limit(1);
            
            if (!tableError) {
              availableTables.push(table);
            }
          } catch (err) {
            // Table doesn't exist or is not accessible
          }
        }
        
        console.log('📋 Available tables:', availableTables.length > 0 ? availableTables.join(', ') : 'None found');
      } else {
        console.log('📋 Tables found:', tablesData);
      }
    } catch (tablesErr) {
      console.log('ℹ️  Could not retrieve table list:', tablesErr.message);
    }

    // Test 4: Check admin user authentication (if users table exists)
    console.log('\n🧪 Test 4: Admin User Check');
    try {
      // This simulates the admin check query
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.log('ℹ️  No authenticated user found (this is normal for testing)');
        console.log('   Auth error:', authError.message);
      } else if (authData.user) {
        console.log('✅ User authenticated:', authData.user.id);
        
        // Try to get user type from users table
        const { data: userTypeData, error: userTypeError } = await supabase
          .from('users')
          .select('id, user_type')
          .eq('id', authData.user.id)
          .single();

        if (userTypeError) {
          console.log('❌ Could not fetch user type:', userTypeError.message);
          console.log('   This indicates the users table may not have the expected structure');
        } else {
          console.log('✅ User type found:', userTypeData.user_type);
        }
      }
    } catch (adminErr) {
      console.log('❌ Admin user check failed:', adminErr.message);
    }

    // Test 5: Test the specific admin query
    console.log('\n🧪 Test 5: Admin Check Query Simulation');
    try {
      const { data: adminCheck, error: adminCheckError } = await supabase
        .rpc('check_admin_status', {});

      if (adminCheckError) {
        console.log('ℹ️  RPC function check_admin_status not available');
        
        // Alternative: Try the specific query mentioned by user
        const { data: manualCheck, error: manualError } = await supabase
          .from('users')
          .select('id, user_type');

        if (manualError) {
          console.log('❌ Manual admin check failed:', manualError.message);
        } else {
          console.log('✅ Manual check completed');
          console.log(`📊 Total users found: ${manualCheck?.length || 0}`);
          
          if (manualCheck && manualCheck.length > 0) {
            const adminUsers = manualCheck.filter(u => 
              u.user_type && u.user_type.toLowerCase().includes('admin')
            );
            console.log(`👑 Admin users found: ${adminUsers.length}`);
          }
        }
      } else {
        console.log('✅ Admin status check successful:', adminCheck);
      }
    } catch (checkErr) {
      console.log('❌ Admin check query failed:', checkErr.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Database connection: WORKING');
    console.log('⚠️  Users table: NEEDS VERIFICATION');
    console.log('⚠️  Admin functionality: REQUIRES SETUP');
    
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error('Stack trace:', err.stack);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    console.log(success ? '\n🎉 Database verification completed' : '\n💥 Database verification failed');
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });