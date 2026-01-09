// Backend Health Check Script
// Tests all critical components of the backend

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🔍 MonsterBackend Health Check\n');
console.log('=' .repeat(50));

// 1. Check Environment Variables
console.log('\n1️⃣  Checking Environment Variables...');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PORT'
];

let envCheckPassed = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') || varName.includes('SECRET') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: MISSING`);
    envCheckPassed = false;
  }
});

if (!envCheckPassed) {
  console.log('\n⚠️  Missing environment variables. Please check your .env file.');
  console.log('   See .env.example for required variables.');
}

// 2. Check Dependencies
console.log('\n2️⃣  Checking Dependencies...');
try {
  const express = await import('express');
  const supabase = await import('@supabase/supabase-js');
  const zod = await import('zod');
  const cors = await import('cors');
  const helmet = await import('helmet');
  console.log('   ✅ All dependencies installed');
} catch (error) {
  console.log(`   ❌ Missing dependency: ${error.message}`);
  console.log('   Run: npm install');
}

// 3. Check File Structure
console.log('\n3️⃣  Checking File Structure...');
import { existsSync } from 'fs';

const requiredFiles = [
  '../server.js',
  '../db/db.js',
  '../middleware/auth.middleware.js',
  '../utils/response.util.js',
  '../utils/validation.util.js',
  '../routes/products.routes.js',
  '../routes/admin-products.routes.js'
];

let fileCheckPassed = true;
requiredFiles.forEach(file => {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - NOT FOUND`);
    fileCheckPassed = false;
  }
});

// 4. Check Syntax
console.log('\n4️⃣  Checking Syntax...');
try {
  // Import main files to check for syntax errors
  const { testConnection } = await import('../db/db.js');
  console.log('   ✅ db/db.js - Syntax OK');
  
  await import('../middleware/auth.middleware.js');
  console.log('   ✅ middleware/auth.middleware.js - Syntax OK');
  
  await import('../utils/response.util.js');
  console.log('   ✅ utils/response.util.js - Syntax OK');
  
  await import('../utils/validation.util.js');
  console.log('   ✅ utils/validation.util.js - Syntax OK');
  
  await import('../routes/admin-products.routes.js');
  console.log('   ✅ routes/admin-products.routes.js - Syntax OK');
  
  console.log('   ✅ All files have valid syntax');
} catch (error) {
  console.log(`   ❌ Syntax Error: ${error.message}`);
  console.log(`   Location: ${error.stack}`);
}

// 5. Test Database Connections (if env vars are set)
if (envCheckPassed) {
  console.log('\n5️⃣  Testing Database Connections...');
  try {
    const { testConnection, testAdminConnection } = await import('../db/db.js');
    
    const regularConnection = await testConnection();
    if (regularConnection) {
      console.log('   ✅ Supabase connection (anon key) - SUCCESS');
    } else {
      console.log('   ❌ Supabase connection (anon key) - FAILED');
    }
    
    const adminConnection = await testAdminConnection();
    if (adminConnection) {
      console.log('   ✅ Supabase admin connection (service role key) - SUCCESS');
    } else {
      console.log('   ❌ Supabase admin connection (service role key) - FAILED');
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test connections: ${error.message}`);
  }
}

// 6. Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Health Check Summary:');

if (envCheckPassed && fileCheckPassed) {
  console.log('   ✅ Backend configuration looks good!');
  console.log('\n   To start the server:');
  console.log('   npm start (production)');
  console.log('   npm run dev (development)');
} else {
  console.log('   ⚠️  Some issues found. Please fix them before starting the server.');
}

console.log('\n' + '='.repeat(50));

