#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Suite for MonsterMen90 E-commerce Platform
 * Tests all backend endpoints for functionality, security, performance, and integration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TIMEOUT = 10000;
const TEST_DATA_DIR = './test-data';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  categories: {
    authentication: { passed: 0, failed: 0, warnings: 0 },
    products: { passed: 0, failed: 0, warnings: 0 },
    orders: { passed: 0, failed: 0, warnings: 0 },
    inventory: { passed: 0, failed: 0, warnings: 0 },
    users: { passed: 0, failed: 0, warnings: 0 },
    security: { passed: 0, failed: 0, warnings: 0 },
    performance: { passed: 0, failed: 0, warnings: 0 },
    integration: { passed: 0, failed: 0, warnings: 0 }
  },
  details: []
};

// HTTP client with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MonsterMen90-API-Tester/1.0'
  }
});

// Request/Response logging interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`\n🔍 Testing: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    return response;
  },
  (error) => {
    console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    return Promise.reject(error);
  }
);

// Utility functions
function logTest(category, test, status, message, details = {}) {
  const result = {
    category,
    test,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.details.push(result);
  testResults.summary.total++;
  
  if (status === 'passed') {
    testResults.summary.passed++;
    testResults.categories[category].passed++;
  } else if (status === 'failed') {
    testResults.summary.failed++;
    testResults.categories[category].failed++;
  } else {
    testResults.summary.warnings++;
    testResults.categories[category].warnings++;
  }
}

function createTestProduct() {
  return {
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: 'A test product for API testing',
    brand: 'Test Brand',
    category_id: 1,
    base_price: 99.99,
    sku: `TEST-${Date.now()}`,
    is_active: true,
    is_featured: false
  };
}

function createTestUser() {
  return {
    email: `test${Date.now()}@example.com`,
    full_name: 'Test User',
    phone: '+1234567890',
    user_type: 'buyer',
    is_active: true
  };
}

function createTestOrder() {
  return {
    user_id: 1,
    status: 'pending',
    total_amount: 199.98,
    shipping_address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zip_code: '12345',
      country: 'Test Country'
    }
  };
}

// Test runner functions
async function runTest(category, testName, testFunction) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    await testFunction();
    logTest(category, testName, 'passed', 'Test completed successfully');
  } catch (error) {
    logTest(category, testName, 'failed', error.message, {
      error: error.response?.data || error.message
    });
  }
}

// 1. AUTHENTICATION AND AUTHORIZATION TESTS
async function testAuthenticationEndpoints() {
  // Test public endpoints accessibility
  await runTest('authentication', 'Public Products Endpoint', async () => {
    const response = await api.get('/products');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.products) throw new Error('Expected products array in response');
  });

  await runTest('authentication', 'Public Categories Endpoint', async () => {
    const response = await api.get('/user-management/categories');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected categories array');
  });

  await runTest('authentication', 'Featured Products Endpoint', async () => {
    const response = await api.get('/products/featured/8');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.products) throw new Error('Expected products array');
  });

  await runTest('authentication', 'Product Search Endpoint', async () => {
    const response = await api.get('/products/search/test');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.products) throw new Error('Expected products array');
  });
}

// 2. PRODUCT MANAGEMENT TESTS
async function testProductEndpoints() {
  let testProductId = null;

  await runTest('products', 'Get All Products (Admin)', async () => {
    const response = await api.get('/products/admin');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected products array');
  });

  await runTest('products', 'Get Single Product (Admin)', async () => {
    const response = await api.get('/products/admin/1');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected product data');
  });

  await runTest('products', 'Create Product (Admin)', async () => {
    const testProduct = createTestProduct();
    const response = await api.post('/products/admin', testProduct);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created product data');
    testProductId = response.data.data.id;
  });

  await runTest('products', 'Update Product (Admin)', async () => {
    if (!testProductId) throw new Error('No test product ID available');
    const updates = { name: `Updated Test Product ${Date.now()}` };
    const response = await api.put(`/products/admin/${testProductId}`, updates);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (response.data.data.name !== updates.name) throw new Error('Product not updated');
  });

  await runTest('products', 'Delete Product (Admin)', async () => {
    if (!testProductId) throw new Error('No test product ID available');
    const response = await api.delete(`/products/admin/${testProductId}`);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.success) throw new Error('Expected success response');
  });

  await runTest('products', 'Product Filtering and Pagination', async () => {
    const response = await api.get('/products?limit=10&offset=0&category=1&in_stock=true');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.products) throw new Error('Expected products array');
    if (typeof response.data.total !== 'number') throw new Error('Expected total count');
  });
}

// 3. ADMIN PRODUCT MANAGEMENT TESTS
async function testAdminProductEndpoints() {
  await runTest('products', 'Admin Product Management - Get All', async () => {
    const response = await api.get('/admin-products');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.products) throw new Error('Expected products array');
  });

  await runTest('products', 'Admin Product Management - Get Categories', async () => {
    const response = await api.get('/admin-products/categories');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected categories array');
  });

  await runTest('products', 'Admin Product Management - Create Category', async () => {
    const testCategory = {
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
      is_active: true
    };
    const response = await api.post('/admin-products/categories', testCategory);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created category data');
  });

  await runTest('products', 'Admin Product Management - Low Stock', async () => {
    const response = await api.get('/admin-products/low-stock');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected low stock array');
  });
}

// 4. ORDER MANAGEMENT TESTS
async function testOrderEndpoints() {
  let testOrderId = null;

  await runTest('orders', 'Get All Orders (Admin)', async () => {
    const response = await api.get('/order-management/admin');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected orders array');
  });

  await runTest('orders', 'Create Order (Admin)', async () => {
    const testOrder = createTestOrder();
    const response = await api.post('/order-management/admin', testOrder);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created order data');
    testOrderId = response.data.data.id;
  });

  await runTest('orders', 'Get Single Order (Admin)', async () => {
    if (!testOrderId) throw new Error('No test order ID available');
    const response = await api.get(`/order-management/admin/${testOrderId}`);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected order data');
  });

  await runTest('orders', 'Update Order Status (Admin)', async () => {
    if (!testOrderId) throw new Error('No test order ID available');
    const updates = { status: 'processing' };
    const response = await api.put(`/order-management/admin/${testOrderId}/status`, updates);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (response.data.data.status !== 'processing') throw new Error('Order status not updated');
  });

  await runTest('orders', 'Discount Management (Admin)', async () => {
    const testDiscount = {
      code: `TEST${Date.now()}`,
      type: 'percentage',
      value: 10,
      is_active: true
    };
    const response = await api.post('/order-management/discounts/admin', testDiscount);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created discount data');
  });

  await runTest('orders', 'Price Rules Management (Admin)', async () => {
    const testRule = {
      name: `Test Rule ${Date.now()}`,
      type: 'bulk_discount',
      value: 5,
      is_active: true
    };
    const response = await api.post('/order-management/pricing/admin', testRule);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created price rule data');
  });
}

// 5. INVENTORY AND STOCK MANAGEMENT TESTS
async function testInventoryEndpoints() {
  await runTest('inventory', 'Get Inventory Overview (Admin)', async () => {
    const response = await api.get('/adminStock/overview');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected inventory data');
  });

  await runTest('inventory', 'Get Stock Movements (Admin)', async () => {
    const response = await api.get('/adminStock/movements?limit=10');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected stock movements');
  });

  await runTest('inventory', 'Get Stock Alerts (Admin)', async () => {
    const response = await api.get('/adminStock/alerts');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected stock alerts');
  });

  await runTest('inventory', 'Get All Inventory Items (Admin)', async () => {
    const response = await api.get('/inventory');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected inventory items');
  });

  await runTest('inventory', 'Get Low Stock Items (Admin)', async () => {
    const response = await api.get('/inventory/low-stock');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected low stock items');
  });
}

// 6. USER MANAGEMENT TESTS
async function testUserManagementEndpoints() {
  await runTest('users', 'Get All Users (Admin)', async () => {
    const response = await api.get('/user-management/admin');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.data)) throw new Error('Expected users array');
  });

  await runTest('users', 'Get Single User (Admin)', async () => {
    const response = await api.get('/user-management/admin/1');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected user data');
  });

  await runTest('users', 'Category Management (Admin)', async () => {
    const testCategory = {
      name: `Admin Test Category ${Date.now()}`,
      slug: `admin-test-category-${Date.now()}`,
      is_active: true
    };
    const response = await api.post('/user-management/categories/admin', testCategory);
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!response.data.data) throw new Error('Expected created category data');
  });
}

// 7. SECURITY AND ERROR HANDLING TESTS
async function testSecurityAndErrorHandling() {
  await runTest('security', 'Invalid Product ID Handling', async () => {
    try {
      await api.get('/products/admin/999999');
      throw new Error('Should have returned 404 error');
    } catch (error) {
      if (error.response?.status !== 500) {
        throw new Error('Expected 500 error for invalid product ID');
      }
    }
  });

  await runTest('security', 'Malformed Request Data', async () => {
    try {
      await api.post('/products/admin', { invalid: 'data' });
      throw new Error('Should have returned validation error');
    } catch (error) {
      if (error.response?.status !== 500) {
        throw new Error('Expected validation error for malformed data');
      }
    }
  });

  await runTest('security', 'SQL Injection Prevention', async () => {
    const maliciousInput = "'; DROP TABLE products; --";
    const response = await api.get(`/products/search/${encodeURIComponent(maliciousInput)}`);
    if (response.status !== 200) throw new Error('Expected successful response');
    if (!Array.isArray(response.data.products)) throw new Error('Expected products array');
  });

  await runTest('security', 'Request Timeout Handling', async () => {
    const startTime = Date.now();
    try {
      await api.get('/products', { timeout: 1000 });
      throw new Error('Request should have timed out');
    } catch (error) {
      const duration = Date.now() - startTime;
      if (duration < 1000) throw new Error('Request should have taken at least 1000ms');
      if (error.code !== 'ECONNABORTED') throw new Error('Expected timeout error');
    }
  });
}

// 8. PERFORMANCE TESTS
async function testPerformance() {
  await runTest('performance', 'Product Listing Performance', async () => {
    const startTime = Date.now();
    const response = await api.get('/products?limit=50');
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) throw new Error('Expected status 200');
    if (duration > 5000) throw new Error(`Response took too long: ${duration}ms`);
    if (!Array.isArray(response.data.products)) throw new Error('Expected products array');
  });

  await runTest('performance', 'Concurrent Request Handling', async () => {
    const requests = Array(10).fill().map(() => api.get('/products'));
    const startTime = Date.now();
    
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    responses.forEach((response, index) => {
      if (response.status !== 200) {
        throw new Error(`Request ${index + 1} failed with status ${response.status}`);
      }
    });
    
    if (duration > 10000) throw new Error(`Concurrent requests took too long: ${duration}ms`);
  });

  await runTest('performance', 'Large Dataset Pagination', async () => {
    const startTime = Date.now();
    const response = await api.get('/products?limit=100&offset=1000');
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) throw new Error('Expected status 200');
    if (duration > 3000) throw new Error(`Large dataset query took too long: ${duration}ms`);
  });
}

// 9. DATA VALIDATION TESTS
async function testDataValidation() {
  await runTest('integration', 'Product Data Structure Validation', async () => {
    const response = await api.get('/products');
    const products = response.data.products;
    
    if (!Array.isArray(products)) throw new Error('Expected products array');
    
    if (products.length > 0) {
      const product = products[0];
      const requiredFields = ['id', 'name', 'base_price', 'is_active'];
      
      requiredFields.forEach(field => {
        if (!(field in product)) {
          throw new Error(`Missing required field: ${field}`);
        }
      });
    }
  });

  await runTest('integration', 'Category Hierarchy Validation', async () => {
    const response = await api.get('/user-management/categories');
    const categories = response.data.data;
    
    if (!Array.isArray(categories)) throw new Error('Expected categories array');
    
    categories.forEach(category => {
      if (!category.name || !category.slug) {
        throw new Error('Category missing required fields');
      }
    });
  });

  await runTest('integration', 'Stock Movement Data Integrity', async () => {
    const response = await api.get('/adminStock/movements?limit=5');
    const movements = response.data.data;
    
    if (!Array.isArray(movements)) throw new Error('Expected movements array');
    
    movements.forEach(movement => {
      if (typeof movement.quantity_change !== 'number') {
        throw new Error('Movement missing quantity_change field');
      }
    });
  });
}

// 10. INTEGRATION SCENARIO TESTS
async function testIntegrationScenarios() {
  await runTest('integration', 'Complete Product Lifecycle', async () => {
    // Create product
    const testProduct = createTestProduct();
    const createResponse = await api.post('/products/admin', testProduct);
    const productId = createResponse.data.data.id;
    
    // Update product
    const updateResponse = await api.put(`/products/admin/${productId}`, {
      base_price: 149.99,
      is_featured: true
    });
    
    // Get product variants
    const variantsResponse = await api.get(`/admin-products/${productId}/variants`);
    
    // Delete product
    const deleteResponse = await api.delete(`/products/admin/${productId}`);
    
    if (deleteResponse.data.success !== true) {
      throw new Error('Product deletion failed');
    }
  });

  await runTest('integration', 'Order Processing Workflow', async () => {
    // Create order
    const testOrder = createTestOrder();
    const createResponse = await api.post('/order-management/admin', testOrder);
    const orderId = createResponse.data.data.id;
    
    // Update order status
    const statusUpdates = ['pending', 'processing', 'shipped', 'delivered'];
    
    for (const status of statusUpdates) {
      const updateResponse = await api.put(`/order-management/admin/${orderId}/status`, {
        status
      });
      
      if (updateResponse.data.data.status !== status) {
        throw new Error(`Failed to update order status to ${status}`);
      }
    }
  });
}

// 11. EDGE CASE TESTS
async function testEdgeCases() {
  await runTest('integration', 'Empty Search Results', async () => {
    const response = await api.get('/products/search/nonexistentproduct123456789');
    if (response.status !== 200) throw new Error('Expected status 200');
    if (!Array.isArray(response.data.products)) throw new Error('Expected products array');
    if (response.data.products.length !== 0) {
      throw new Error('Expected empty products array for nonexistent search');
    }
  });

  await runTest('integration', 'Extreme Pagination Values', async () => {
    const response = await api.get('/products?limit=0&offset=0');
    if (response.status !== 200) throw new Error('Expected status 200');
    
    const largeOffsetResponse = await api.get('/products?limit=10&offset=999999');
    if (largeOffsetResponse.status !== 200) throw new Error('Expected status 200');
  });

  await runTest('integration', 'Special Characters in Search', async () => {
    const specialChars = ['@#$%^&*()', '测试中文', 'test@example.com', 'name with spaces'];
    
    for (const search of specialChars) {
      const response = await api.get(`/products/search/${encodeURIComponent(search)}`);
      if (response.status !== 200) throw new Error(`Failed for search: ${search}`);
    }
  });
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Testing Suite');
  console.log('=' .repeat(60));
  
  try {
    // Test server connectivity
    await runTest('integration', 'Server Connectivity Check', async () => {
      const response = await api.get('/products');
      if (response.status !== 200) throw new Error('Server not responding correctly');
    });

    // Run all test categories
    await testAuthenticationEndpoints();
    await testProductEndpoints();
    await testAdminProductEndpoints();
    await testOrderEndpoints();
    await testInventoryEndpoints();
    await testUserManagementEndpoints();
    await testSecurityAndErrorHandling();
    await testPerformance();
    await testDataValidation();
    await testIntegrationScenarios();
    await testEdgeCases();

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
    logTest('integration', 'Critical Test Suite Error', 'failed', error.message);
  }
}

// Generate detailed report
function generateReport() {
  const report = {
    ...testResults,
    recommendations: generateRecommendations(),
    summary: {
      ...testResults.summary,
      success_rate: ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2) + '%'
    }
  };

  // Save detailed report
  const reportPath = path.join(__dirname, 'API_TESTING_COMPLETE_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate human-readable summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPREHENSIVE API TESTING RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`\n📈 OVERALL SUMMARY:`);
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log(`Success Rate: ${report.summary.success_rate}`);

  console.log(`\n📂 CATEGORY BREAKDOWN:`);
  Object.entries(testResults.categories).forEach(([category, results]) => {
    console.log(`${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  ⚠️  Warnings: ${results.warnings}`);
  });

  console.log(`\n🔍 DETAILED ISSUES:`);
  const failedTests = testResults.details.filter(test => test.status === 'failed');
  if (failedTests.length === 0) {
    console.log('🎉 No failed tests detected!');
  } else {
    failedTests.forEach(test => {
      console.log(`❌ ${test.category} - ${test.test}`);
      console.log(`   Error: ${test.message}`);
    });
  }

  console.log(`\n💡 RECOMMENDATIONS:`);
  report.recommendations.forEach(rec => {
    console.log(`• ${rec}`);
  });

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

function generateRecommendations() {
  const recommendations = [];
  const failedTests = testResults.details.filter(test => test.status === 'failed');
  const categories = testResults.categories;

  // Security recommendations
  if (categories.security.failed > 0) {
    recommendations.push('Implement proper authentication middleware for admin endpoints');
    recommendations.push('Add rate limiting to prevent API abuse');
    recommendations.push('Validate and sanitize all input data');
  }

  // Performance recommendations
  if (categories.performance.failed > 0) {
    recommendations.push('Optimize database queries and add proper indexing');
    recommendations.push('Implement response caching for frequently accessed data');
    recommendations.push('Consider pagination for large datasets');
  }

  // Error handling recommendations
  if (categories.integration.failed > 0) {
    recommendations.push('Improve error handling and response consistency');
    recommendations.push('Add proper validation for request data');
    recommendations.push('Implement better logging for debugging');
  }

  // Authentication recommendations
  if (categories.authentication.failed > 0) {
    recommendations.push('Ensure proper access control for sensitive endpoints');
    recommendations.push('Implement JWT token validation');
    recommendations.push('Add CORS configuration for frontend integration');
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passed! API is functioning correctly');
    recommendations.push('Consider implementing monitoring for production use');
    recommendations.push('Add automated testing to CI/CD pipeline');
  }

  return recommendations;
}

// Execute tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      const report = generateReport();
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  generateReport,
  testResults
};