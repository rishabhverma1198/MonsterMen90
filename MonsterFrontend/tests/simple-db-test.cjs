/**
 * Simple Database Connectivity Test
 * Tests basic Supabase connection and checks for users table
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.error('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.error('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('🔍 Starting Simple Database Test...\n');
console.log('📍 Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  try {
    // Test 1: Basic connectivity with products table
    console.log('\n🧪 Test 1: Basic Database Connection');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (productsError) {
      console.error('❌ Products table error:', productsError.message);
    } else {
      console.log('✅ Products table accessible');
    }

    // Test 2: Check users table specifically
    console.log('\n🧪 Test 2: Users Table Check');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, user_type')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      console.log('💡 This indicates the users table may not exist or is not accessible');
      console.log('💡 Error details:', usersError);
    } else {
      console.log('✅ Users table accessible');
      console.log('📊 Users found:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('👤 Sample users:', users.slice(0, 3));
      }
    }

    // Test 3: Check if auth.uid() works
    console.log('\n🧪 Test 3: Auth UID Test');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('ℹ️  Auth error (expected for unauthenticated):', authError.message);
    } else if (authData.session) {
      console.log('✅ User authenticated:', authData.session.user.id);
      
      // Test the specific admin query
      const { data: adminCheck, error: adminError } = await supabase
        .from('users')
        .select('id, user_type')
        .eq('id', authData.session.user.id);

      if (adminError) {
        console.log('❌ Admin check query failed:', adminError.message);
      } else {
        console.log('✅ Admin check query successful:', adminCheck);
      }
    } else {
      console.log('ℹ️  No authenticated user (expected for this test)');
    }

    // Test 4: Check table structure (if users table exists)
    if (!usersError) {
      console.log('\n🧪 Test 4: Users Table Structure Analysis');
      try {
        // Try to get more details about the users table
        const { data: detailedUsers, error: detailError } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (detailError) {
          console.log('❌ Detailed query failed:', detailError.message);
        } else {
          console.log('✅ Users table structure accessible');
          if (detailedUsers && detailedUsers.length > 0) {
            const user = detailedUsers[0];
            console.log('📋 Available columns:', Object.keys(user));
            
            // Check for admin users specifically
            const { data: allUsers, error: allError } = await supabase
              .from('users')
              .select('user_type');

            if (!allError && allUsers) {
              const adminCount = allUsers.filter(u => 
                u.user_type && u.user_type.toLowerCase().includes('admin')
              ).length;
              console.log(`👑 Admin users found: ${adminCount}`);
              console.log('📊 All user types:', [...new Set(allUsers.map(u => u.user_type).filter(Boolean))]);
            }
          }
        }
      } catch (detailErr) {
        console.log('❌ Detailed analysis failed:', detailErr.message);
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log('Database connection:', !productsError ? '✅ WORKING' : '❌ FAILED');
    console.log('Users table:', !usersError ? '✅ EXISTS' : '❌ MISSING/INACCESSIBLE');
    
    if (usersError) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Check if users table exists in Supabase dashboard');
      console.log('2. Verify RLS policies allow read access');
      console.log('3. Ensure users table has id and user_type columns');
      console.log('4. Create users table if missing');
      console.log('5. Insert admin user with user_type = "admin"');
    }

    return !usersError;

  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
    return false;
  }
}

// Run the test
testDatabase()
  .then((success) => {
    console.log(success ? '\n🎉 Database test completed successfully' : '\n💥 Database test found issues');
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
  });