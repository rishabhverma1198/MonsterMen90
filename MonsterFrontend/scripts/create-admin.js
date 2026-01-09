#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script creates an admin user for the MonsterMen90 platform.
 * Run this script to set up admin access if login is not working.
 * 
 * Usage:
 * node scripts/create-admin.js
 * 
 * Requirements:
 * - Supabase project must be configured
 * - Environment variables must be set in .env
 * - Node.js must be installed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123456',
  fullName: 'System Administrator'
};

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    console.log(`Email: ${ADMIN_CREDENTIALS.email}`);

    // Step 1: Create auth user
    console.log('\n📝 Step 1: Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      options: {
        data: {
          full_name: ADMIN_CREDENTIALS.fullName
        }
      }
    });

    if (authError) {
      // If user already exists, try to sign in instead
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists, attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_CREDENTIALS.email,
          password: ADMIN_CREDENTIALS.password
        });

        if (signInError) throw signInError;
        
        console.log('✅ Successfully signed in existing admin user');
        await createOrUpdateUserRecord(signInData.user);
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Authentication user created successfully');
      await createOrUpdateUserRecord(authData.user);
    }

    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
    console.log('\n🌐 Access admin panel at: http://localhost:5173/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

async function createOrUpdateUserRecord(user) {
  try {
    console.log('\n📊 Step 2: Creating/updating user record...');

    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || ADMIN_CREDENTIALS.fullName,
        user_type: 'admin',
        phone: '+91-9876543210',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (dbError) {
      console.error('❌ Database error:', dbError.message);
      throw dbError;
    }

    console.log('✅ User record created/updated successfully');

    // Verify the record was created
    const { data: userRecord, error: verifyError } = await supabase
      .from('users')
      .select('id, email, user_type, is_active')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      throw verifyError;
    }

    console.log('✅ User record verified:', {
      id: userRecord.id,
      email: userRecord.email,
      user_type: userRecord.user_type,
      is_active: userRecord.is_active
    });

  } catch (error) {
    console.error('❌ Error creating user record:', error.message);
    throw error;
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export { createAdminUser };