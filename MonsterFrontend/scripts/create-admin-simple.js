#!/usr/bin/env node

/**
 * Simple Admin User Creation Script - Focus on Auth User Only
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_CREDENTIALS = {
  email: 'admin@monstermen90.com',
  password: 'Admin123456!',
  fullName: 'System Administrator'
};

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user in Supabase Auth...');
    console.log(`Email: ${ADMIN_CREDENTIALS.email}`);

    // Try to sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      options: {
        data: {
          full_name: ADMIN_CREDENTIALS.fullName
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('⚠️  User already exists, attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_CREDENTIALS.email,
          password: ADMIN_CREDENTIALS.password
        });

        if (signInError) throw signInError;
        
        console.log('✅ Successfully signed in existing admin user');
        console.log(`User ID: ${signInData.user.id}`);
        console.log(`Email: ${signInData.user.email}`);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${data.user.id}`);
      console.log(`Email: ${data.user.email}`);
    }

    console.log('\n🎉 Admin user setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
    console.log('\n🌐 Access admin panel at: http://localhost:5174/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();