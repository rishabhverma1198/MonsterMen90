#!/usr/bin/env node

/**
 * MonsterMen90 Database Setup Script
 * 
 * This script helps set up the database schema for the MonsterMen90 e-commerce platform.
 * It can be used with either local Supabase or cloud Supabase instances.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'bright');
  log(message, 'bright');
  log('='.repeat(60), 'bright');
}

function logStep(message) {
  log(`\n▶ ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function readSQLFile(filename) {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logError(`Failed to read ${filename}: ${error.message}`);
    return null;
  }
}

function validateEnvironment() {
  logStep('Validating Environment Configuration');
  
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logError('Missing required environment variables:');
    missingVars.forEach(varName => {
      log(`  - ${varName}`, 'red');
    });
    log('\nPlease configure these in your .env file:', 'yellow');
    log('VITE_SUPABASE_URL=http://localhost:54321  (or your Supabase project URL)');
    log('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
    return false;
  }
  
  // Check for demo credentials
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl === 'https://demo.supabase.co' || supabaseKey === 'demo_anon_key') {
    logWarning('Demo credentials detected. Please use real Supabase credentials.');
    return false;
  }
  
  logSuccess('Environment variables validated');
  return true;
}

function checkMigrationFiles() {
  logStep('Checking Migration Files');
  
  const migrations = [
    '001_initial_schema.sql',
    '002_add_product_fields.sql'
  ];
  
  for (const migration of migrations) {
    const content = readSQLFile(migration);
    if (content) {
      logSuccess(`Found migration: ${migration} (${content.length} characters)`);
    } else {
      logError(`Missing migration file: ${migration}`);
      return false;
    }
  }
  
  return true;
}

function generateSetupInstructions() {
  logStep('Generating Setup Instructions');
  
  const instructions = `
# MonsterMen90 Database Setup Instructions

## Quick Setup Steps:

### 1. Local Supabase Setup
\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Start Supabase locally
supabase start

# Apply migrations
supabase db reset
\`\`\`

### 2. Get Your Anon Key
After running \`supabase start\`, look for:
- API URL (anon key) in the output
- Studio URL for database management

### 3. Update Environment
Update your .env file:
\`\`\`env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_output
\`\`\`

### 4. Cloud Supabase Setup
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings > API to get your URL and anon key
4. Update .env file with cloud credentials
5. Run migrations in Supabase SQL Editor

## Migration Files:
- \`001_initial_schema.sql\` - Core database schema
- \`002_add_product_fields.sql\` - Product enhancements

## Test the Setup:
1. Start development server: \`npm run dev\`
2. Login to admin: http://localhost:3000/admin/login
3. Navigate to products: http://localhost:3000/admin/products
4. Try adding a test product
5. Check if it appears on buyer homepage: http://localhost:3000/buyer
`;

  const instructionsPath = path.join(__dirname, 'DATABASE_SETUP.md');
  fs.writeFileSync(instructionsPath, instructions);
  logSuccess(`Setup instructions saved to: ${instructionsPath}`);
}

function main() {
  logHeader('MonsterMen90 Database Setup');
  log('Setting up database schema for production e-commerce platform...');
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(__dirname, 'supabase'))) {
    logError('Please run this script from the project root directory');
    process.exit(1);
  }
  
  // Validate environment
  if (!validateEnvironment()) {
    log('\nPlease fix the environment configuration and run again.', 'yellow');
    process.exit(1);
  }
  
  // Check migration files
  if (!checkMigrationFiles()) {
    log('\nPlease ensure all migration files are present.', 'yellow');
    process.exit(1);
  }
  
  // Generate setup instructions
  generateSetupInstructions();
  
  logHeader('Setup Complete');
  logSuccess('Database setup validation passed!');
  log('\nNext steps:', 'cyan');
  log('1. Ensure Supabase is running (local or cloud)');
  log('2. Apply database migrations');
  log('3. Start development server: npm run dev');
  log('4. Test admin product management functionality');
  
  log('\nFor detailed instructions, see:', 'cyan');
  log('- DATABASE_SETUP.md');
  log('- SETUP_INSTRUCTIONS.md');
  log('- SUPABASE_SETUP.md');
}

// Run the setup script
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, checkMigrationFiles, generateSetupInstructions };