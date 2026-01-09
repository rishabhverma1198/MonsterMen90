#!/usr/bin/env node

/**
 * MonsterMen90 Product Management Test Script
 * 
 * This script tests the admin product management functionality to ensure
 * all CRUD operations and website integration are working correctly.
 */

const { createClient } = require('@supabase/supabase-js');
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

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

class ProductManagementTester {
  constructor() {
    this.supabase = null;
    this.testResults = {
      connection: false,
      database: false,
      products: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      categories: false,
      websiteIntegration: false,
      search: false
    };
  }

  async init() {
    logHeader('MonsterMen90 Product Management Test Suite');
    log('Testing admin product management functionality...');

    // Load environment variables
    await this.loadEnvironment();
    
    // Initialize Supabase client
    await this.initSupabase();
  }

  async loadEnvironment() {
    logStep('Loading Environment Configuration');
    
    try {
      // Simple .env parser
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            envVars[key] = valueParts.join('=');
          }
        });
        
        // Set environment variables
        Object.keys(envVars).forEach(key => {
          process.env[key] = envVars[key];
        });
        
        logSuccess('Environment variables loaded from .env file');
      } else {
        logWarning('.env file not found, using system environment variables');
      }
    } catch (error) {
      logWarning(`Could not load .env file: ${error.message}`);
    }
  }

  async initSupabase() {
    logStep('Initializing Supabase Client');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logError('Missing Supabase configuration');
      log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
      return;
    }
    
    if (supabaseUrl === 'https://demo.supabase.co' || supabaseKey === 'demo_anon_key') {
      logError('Demo credentials detected. Please use real Supabase credentials.');
      return;
    }
    
    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      logSuccess('Supabase client initialized');
    } catch (error) {
      logError(`Failed to initialize Supabase client: ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    logStep('Testing Database Connection');
    
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      this.testResults.database = true;
      logSuccess('Database connection successful');
    } catch (error) {
      logError(`Database connection failed: ${error.message}`);
      log('Possible issues:', 'yellow');
      log('- Supabase project not running');
      log('- Invalid credentials');
      log('- Network connectivity');
      log('- Database not migrated');
    }
  }

  async testCategories() {
    logStep('Testing Categories Table');
    
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .limit(5);
      
      if (error) {
        throw error;
      }
      
      this.testResults.categories = true;
      logSuccess(`Categories table accessible (${data.length} categories found)`);
      
      if (data.length === 0) {
        logWarning('No categories found. You may need to run migrations or seed data.');
      } else {
        data.forEach(category => {
          log(`  - ${category.name} (${category.slug})`, 'blue');
        });
      }
    } catch (error) {
      logError(`Categories test failed: ${error.message}`);
    }
  }

  async testProductCRUD() {
    logStep('Testing Product CRUD Operations');
    
    // Create test product
    await this.testCreateProduct();
    
    // Read products
    await this.testReadProducts();
    
    // Update product
    await this.testUpdateProduct();
    
    // Delete product
    await this.testDeleteProduct();
  }

  async testCreateProduct() {
    try {
      const testProduct = {
        name: 'Test Cotton Shirt',
        description: 'A high-quality cotton shirt for testing',
        short_description: 'Premium cotton test shirt',
        gender: 'men',
        product_type: 'Shirts',
        base_price: 899.00,
        brand: 'Test Brand',
        material: '100% Cotton',
        available_sizes: ['S', 'M', 'L', 'XL'],
        is_active: true,
        is_featured: false
      };

      const { data, error } = await this.supabase
        .from('products')
        .insert([testProduct])
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.testProductId = data.id;
      this.testResults.products.create = true;
      logSuccess('Product created successfully');
      log(`  Product ID: ${data.id}`);
      log(`  Product Name: ${data.name}`);

    } catch (error) {
      logError(`Product creation failed: ${error.message}`);
      log('This might be due to missing categories or foreign key constraints');
    }
  }

  async testReadProducts() {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .limit(10);

      if (error) {
        throw error;
      }

      this.testResults.products.read = true;
      logSuccess(`Products read successfully (${data.length} products found)`);

      if (data.length === 0) {
        logWarning('No products found in database');
      } else {
        data.forEach(product => {
          log(`  - ${product.name} (${product.base_price})`, 'blue');
        });
      }

    } catch (error) {
      logError(`Product reading failed: ${error.message}`);
    }
  }

  async testUpdateProduct() {
    if (!this.testProductId) {
      logWarning('Skipping update test - no test product ID available');
      return;
    }

    try {
      const updates = {
        base_price: 999.00,
        description: 'Updated test description'
      };

      const { data, error } = await this.supabase
        .from('products')
        .update(updates)
        .eq('id', this.testProductId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.testResults.products.update = true;
      logSuccess('Product updated successfully');
      log(`  New price: ₹${data.base_price}`);

    } catch (error) {
      logError(`Product update failed: ${error.message}`);
    }
  }

  async testDeleteProduct() {
    if (!this.testProductId) {
      logWarning('Skipping delete test - no test product ID available');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', this.testProductId);

      if (error) {
        throw error;
      }

      this.testResults.products.delete = true;
      logSuccess('Product deleted successfully');

    } catch (error) {
      logError(`Product deletion failed: ${error.message}`);
    }
  }

  async testWebsiteIntegration() {
    logStep('Testing Website Integration');
    
    try {
      // Test getting active products (what website shows)
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('is_active', true)
        .limit(5);

      if (error) {
        throw error;
      }

      this.testResults.websiteIntegration = true;
      logSuccess(`Website integration test passed (${data.length} active products)`);
      log('These products would appear on the buyer/wholeseller website');

    } catch (error) {
      logError(`Website integration test failed: ${error.message}`);
    }
  }

  async testSearchFunctionality() {
    logStep('Testing Search Functionality');
    
    try {
      // Test search by name
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .ilike('name', '%shirt%')
        .limit(5);

      if (error) {
        throw error;
      }

      this.testResults.search = true;
      logSuccess(`Search functionality test passed (${data.length} results for 'shirt')`);
      
      if (data.length === 0) {
        logInfo('No products found with "shirt" in name (expected if no test data)');
      }

    } catch (error) {
      logError(`Search test failed: ${error.message}`);
    }
  }

  generateReport() {
    logHeader('Test Results Summary');
    
    const tests = [
      { name: 'Database Connection', result: this.testResults.database },
      { name: 'Categories Access', result: this.testResults.categories },
      { name: 'Product Create', result: this.testResults.products.create },
      { name: 'Product Read', result: this.testResults.products.read },
      { name: 'Product Update', result: this.testResults.products.update },
      { name: 'Product Delete', result: this.testResults.products.delete },
      { name: 'Website Integration', result: this.testResults.websiteIntegration },
      { name: 'Search Functionality', result: this.testResults.search }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach(test => {
      if (test.result) {
        log(`${test.name}: PASSED`, 'green');
        passedTests++;
      } else {
        log(`${test.name}: FAILED`, 'red');
      }
    });

    log(`\nOverall Score: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');

    if (passedTests === totalTests) {
      logSuccess('All tests passed! Admin product management is fully functional.');
    } else {
      logWarning(`${totalTests - passedTests} tests failed. Please check the configuration.`);
    }

    // Generate recommendations
    log('\nRecommendations:', 'cyan');
    
    if (!this.testResults.database) {
      log('- Check Supabase configuration and credentials');
      log('- Ensure database migrations have been applied');
    }
    
    if (!this.testResults.categories) {
      log('- Run database migrations to create categories table');
      log('- Check foreign key constraints');
    }
    
    if (!this.testResults.products.create) {
      log('- Ensure categories exist before creating products');
      log('- Check product table schema and constraints');
    }

    log('\nNext Steps:', 'cyan');
    log('1. Fix any failing tests');
    log('2. Start development server: npm run dev');
    log('3. Test admin interface: http://localhost:3000/admin/products');
    log('4. Test website integration: http://localhost:3000/buyer');
  }

  async run() {
    try {
      await this.init();
      await this.testDatabaseConnection();
      await this.testCategories();
      await this.testProductCRUD();
      await this.testWebsiteIntegration();
      await this.testSearchFunctionality();
      this.generateReport();
    } catch (error) {
      logError(`Test suite failed: ${error.message}`);
    }
  }
}

// Run the test suite
async function main() {
  const tester = new ProductManagementTester();
  await tester.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProductManagementTester;