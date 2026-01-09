const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './MonsterFrontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminSetup() {
  console.log('🔍 Testing Admin Panel Setup...\n');
  
  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return;
  }

  // Test 2: Check if admin user exists
  console.log('2. Checking for admin users...');
  try {
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, user_type, is_active')
      .eq('user_type', 'admin');

    if (adminError) throw adminError;

    if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Found admin users:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (active: ${user.is_active})`);
      });
    } else {
      console.log('❌ No admin users found in database');
      console.log('💡 Run: node MonsterFrontend/scripts/create-admin.js');
    }
    console.log('');
  } catch (err) {
    console.error('❌ Error checking admin users:', err.message);
  }

  // Test 3: Check if auth users exist
  console.log('3. Checking authentication users...');
  try {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    const adminAuthUsers = users.filter(user => 
      user.email === 'admin@example.com' || 
      user.user_metadata?.full_name?.includes('admin')
    );

    if (adminAuthUsers.length > 0) {
      console.log('✅ Found admin auth users:');
      adminAuthUsers.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    } else {
      console.log('❌ No admin auth users found');
    }
  } catch (err) {
    console.error('❌ Error checking auth users:', err.message);
    console.log('💡 Note: This requires service role key');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If no admin users found, create one with the script');
  console.log('2. Navigate to http://localhost:5174/admin/login');
  console.log('3. Try logging in with admin@example.com / admin123456');
}

testAdminSetup();