import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL. Please check your .env file.');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_ANON_KEY. Please check your .env file.');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Please check your .env file.');
  process.exit(1);
}

// ✅ SECURITY FIX: Create Supabase client with ANON key for regular operations
// This respects Row Level Security (RLS) policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'MonsterBackend'
    }
  }
});

// ✅ SECURITY FIX: Create separate admin client with service role key
// Use ONLY for operations that need to bypass RLS (admin operations)
// This should be used sparingly and only in protected admin routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'MonsterBackend-Admin'
    }
  }
});

// Test the connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful (using anon key)');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err.message);
    return false;
  }
};

// Test admin connection (service role)
export const testAdminConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase admin connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase admin connection successful (using service role key)');
    return true;
  } catch (err) {
    console.error('Supabase admin connection error:', err.message);
    return false;
  }
};

// Export default client (anon key - for regular operations)
export default supabase;