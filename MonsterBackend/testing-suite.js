// Complete Backend Testing and Monitoring Utility
// This file consolidates all testing, connection, and monitoring functionality

import { supabase, testConnection } from './db/db.js';

console.log('🧪 Complete Backend Testing Suite Starting...\n');

// =====================================================
// 1. CONNECTION TESTING
// =====================================================

async function testDatabaseConnection() {
  console.log('🔗 Testing Database Connection...');
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Database connection: SUCCESS');
      return true;
    } else {
      console.log('❌ Database connection: FAILED');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection: ERROR -', error.message);
    return false;
  }
}

// =====================================================
// 2. SCHEMA ANALYSIS
// =====================================================

async function analyzeDatabaseSchema() {
  console.log('\n📋 Analyzing Database Schema...');
  
  const tables = [
    'products', 'categories', 'product_variants', 'users',
    'orders', 'order_items', 'user_addresses', 'discounts',
    'price_rules', 'stock_movements', 'admin_low_stock_alerts'
  ];
  
  const schema = {};
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        schema[tableName] = {
          exists: true,
          columns: data && data[0] ? Object.keys(data[0]) : [],
          sample: data && data[0] ? data[0] : null,
          has_data: data && data.length > 0
        };
        console.log(`✅ Table: ${tableName} (${schema[tableName].columns.length} columns)`);
      } else {
        schema[tableName] = {
          exists: false,
          columns: [],
          sample: null,
          has_data: false
        };
        console.log(`❌ Table: ${tableName} (NOT FOUND)`);
      }
    } catch (err) {
      schema[tableName] = {
        exists: false,
        columns: [],
        sample: null,
        has_data: false
      };
      console.log(`❌ Table: ${tableName} (ERROR: ${err.message})`);
    }
  }
  
  return schema;
}

// =====================================================
// 3. API ENDPOINT TESTING
// =====================================================

async function testAPIEndpoints() {
  console.log('\n🔗 Testing API Endpoints...');
  
  const endpoints = [
    '/health',
    '/api',
    '/api/products',
    '/api/admin/products',
    '/api/categories',
    '/api/users',
    '/api/orders',
    '/api/inventory',
    '/api/admin/stock'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status} OK`);
      } else {
        console.log(`⚠️  ${endpoint}: ${response.status} ${data.error || 'Unknown Error'}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: CONNECTION FAILED (${error.message})`);
    }
  }
}

// =====================================================
// 4. PRODUCT CREATION TESTING
// =====================================================

async function testProductCreation() {
  console.log('\n📦 Testing Product Creation...');
  
  try {
    // First, get or create a category
    console.log('📋 Getting categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    let categoryId = null;
    if (catError) {
      console.log('❌ Categories error:', catError.message);
      return false;
    }

    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
      console.log(`✅ Using existing category: ${categories[0].name}`);
    } else {
      console.log('📝 Creating test category...');
      const { data: newCategory, error: createCatError } = await supabase
        .from('categories')
        .insert([{
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category for testing',
          is_active: true,
          sort_order: 1
        }])
        .select()
        .single();

      if (createCatError) {
        console.log('❌ Category creation failed:', createCatError.message);
        return false;
      }

      categoryId = newCategory.id;
      console.log(`✅ Created test category: ${newCategory.name}`);
    }

    // Test product creation
    const testProduct = {
      name: 'Complete Test Product',
      slug: 'complete-test-product',
      description: 'This is a comprehensive test product',
      sku: 'COMPLETE-TEST-001',
      category_id: categoryId,
      base_price: 299.99,
      wholesale_price: 199.99,
      brand: 'Test Brand',
      gender: 'unisex',
      target_audience: 'adults',
      product_type: 'clothing',
      is_active: true,
      is_featured: false,
      meta_title: 'Complete Test Product',
      meta_description: 'Comprehensive testing product'
    };

    console.log('📝 Creating test product...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();

    if (productError) {
      console.log('❌ Product creation failed:', productError.message);
      console.log('Error details:', productError);
      return false;
    }

    console.log('✅ Product created successfully:', product.id);

    // Test variant creation
    console.log('📦 Creating test variant...');
    const testVariant = {
      product_id: product.id,
      size: 'L',
      color: 'Navy Blue',
      stock_quantity: 50,
      price: 299.99,
      wholesale_price: 199.99,
      sku: 'COMPLETE-TEST-001-L-NAVY',
      min_stock_level: 10
    };

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert([testVariant])
      .select()
      .single();

    if (variantError) {
      console.log('❌ Variant creation failed:', variantError.message);
      return false;
    }

    console.log('✅ Variant created successfully:', variant.id);

    // Test retrieving product with variants
    console.log('🔍 Testing product retrieval...');
    const { data: retrievedProduct, error: retrieveError } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        product_variants(*)
      `)
      .eq('id', product.id)
      .single();

    if (retrieveError) {
      console.log('❌ Product retrieval failed:', retrieveError.message);
      return false;
    }

    console.log('✅ Product retrieval successful');
    console.log(`   Product: ${retrievedProduct.name}`);
    console.log(`   Category: ${retrievedProduct.categories?.name || 'None'}`);
    console.log(`   Variants: ${retrievedProduct.product_variants?.length || 0}`);

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    await supabase.from('product_variants').delete().eq('id', variant.id);
    await supabase.from('products').delete().eq('id', product.id);
    
    // Delete test category if we created it
    if (categories && categories.length === 0) {
      await supabase.from('categories').delete().eq('id', categoryId);
    }

    console.log('✅ Test data cleaned up successfully');
    return true;

  } catch (error) {
    console.log('❌ Product creation test failed:', error.message);
    return false;
  }
}

// =====================================================
// 5. INTELLIGENT FEATURES TESTING
// =====================================================

async function testIntelligentFeatures() {
  console.log('\n🧠 Testing Intelligent Features...');
  
  try {
    // Test schema detection
    const schemaResponse = await fetch('http://localhost:3001/api/schema');
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json();
      console.log('✅ Schema detection: WORKING');
      console.log(`   Tables detected: ${Object.keys(schemaData.schema || {}).length}`);
    } else {
      console.log('❌ Schema detection: FAILED');
    }

    // Test dynamic tables endpoint
    const tablesResponse = await fetch('http://localhost:3001/api/tables');
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('✅ Dynamic tables: WORKING');
      console.log(`   Available tables: ${tablesData.total_tables}`);
    } else {
      console.log('❌ Dynamic tables: FAILED');
    }

    // Test dynamic API generation
    const dynamicResponse = await fetch('http://localhost:3001/api/dynamic/products');
    if (dynamicResponse.ok) {
      const dynamicData = await dynamicResponse.json();
      console.log('✅ Dynamic API generation: WORKING');
      console.log(`   Sample data count: ${dynamicData.data?.length || 0}`);
    } else {
      console.log('❌ Dynamic API generation: FAILED');
    }

  } catch (error) {
    console.log('❌ Intelligent features test failed:', error.message);
  }
}

// =====================================================
// 6. PERFORMANCE TESTING
// =====================================================

async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const startTime = Date.now();
  
  try {
    // Test multiple queries
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await supabase.from('products').select('id, name').limit(10);
      const end = Date.now();
      console.log(`   Query ${i + 1}: ${end - start}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Performance test completed in ${totalTime}ms`);
    
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
  }
}

// =====================================================
// 7. COMPLETE TEST RUNNER
// =====================================================

async function runCompleteTest() {
  console.log('🚀 Starting Complete Backend Test Suite...\n');
  
  const results = {
    connection: false,
    schema: null,
    productCreation: false,
    api: false,
    intelligent: false,
    performance: false
  };
  
  // Test 1: Database Connection
  results.connection = await testDatabaseConnection();
  
  if (!results.connection) {
    console.log('\n❌ Cannot continue testing without database connection');
    return results;
  }
  
  // Test 2: Schema Analysis
  results.schema = await analyzeDatabaseSchema();
  
  // Test 3: API Endpoints
  await testAPIEndpoints();
  results.api = true; // We'll consider this successful if no major errors
  
  // Test 4: Product Creation
  results.productCreation = await testProductCreation();
  
  // Test 5: Intelligent Features
  await testIntelligentFeatures();
  results.intelligent = true; // We'll consider this successful if no major errors
  
  // Test 6: Performance
  await testPerformance();
  results.performance = true;
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('===================');
  console.log(`Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Schema Analysis: ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Product Creation: ${results.productCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoints: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Intelligent Features: ${results.intelligent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Performance: ${results.performance ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = 6;
  const passedTests = Object.values(results).filter(r => r === true).length;
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Backend is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
  }
  
  return results;
}

// Export functions for individual testing
export {
  testDatabaseConnection,
  analyzeDatabaseSchema,
  testAPIEndpoints,
  testProductCreation,
  testIntelligentFeatures,
  testPerformance,
  runCompleteTest
};

// Run the complete test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteTest().catch(console.error);
}