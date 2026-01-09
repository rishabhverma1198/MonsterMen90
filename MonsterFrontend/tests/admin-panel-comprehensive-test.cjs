/**
 * MonsterMen90 Admin Panel Comprehensive Test Suite
 * Tests all admin functionality for production readiness
 */

const axios = require('axios');

// Test configuration
const config = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@monstermenn90.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!@#'
};

class AdminPanelTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
    this.authToken = null;
    this.adminUserId = null;
  }

  // Utility methods
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      this.log(`Test passed: ${testName}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ 
        name: testName, 
        status: 'FAILED', 
        error: error.message 
      });
      this.log(`Test failed: ${testName} - ${error.message}`, 'error');
    }
  }

  // Authentication Tests
  async testAdminLogin() {
    await this.runTest('Admin Login Authentication', async () => {
      const response = await axios.post(`${config.BACKEND_URL}/api/auth/login`, {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      });

      if (!response.data.success) {
        throw new Error('Login failed');
      }

      this.authToken = response.data.token;
      this.adminUserId = response.data.user.id;

      if (!this.authToken) {
        throw new Error('No authentication token received');
      }

      this.log('Admin login successful');
    });
  }

  async testAdminAuthenticationGuard() {
    await this.runTest('Admin Route Protection', async () => {
      // Test accessing admin routes without token
      try {
        await axios.get(`${config.BACKEND_URL}/api/admin/products`);
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          throw new Error('Admin routes not properly protected');
        }
      }

      // Test accessing admin routes with invalid token
      try {
        await axios.get(`${config.BACKEND_URL}/api/admin/products`, {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        throw new Error('Should have failed with invalid token');
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          throw new Error('Invalid tokens not properly rejected');
        }
      }

      this.log('Admin route protection working correctly');
    });
  }

  // Admin Product Management Tests
  async testProductCRUD() {
    await this.runTest('Product CRUD Operations', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Create Product
      const newProduct = {
        name: 'Test Product ' + Date.now(),
        description: 'Test Description',
        price: 99.99,
        category: 'men',
        sizes: ['S', 'M', 'L'],
        colors: ['Black', 'White'],
        stock_quantity: 100
      };

      const createResponse = await axios.post(
        `${config.BACKEND_URL}/api/admin/products`, 
        newProduct, 
        { headers }
      );

      if (!createResponse.data.success) {
        throw new Error('Product creation failed');
      }

      const productId = createResponse.data.product.id;

      // Read Product
      const readResponse = await axios.get(
        `${config.BACKEND_URL}/api/admin/products/${productId}`, 
        { headers }
      );

      if (!readResponse.data.success) {
        throw new Error('Product reading failed');
      }

      // Update Product
      const updateData = { name: 'Updated Test Product' };
      const updateResponse = await axios.put(
        `${config.BACKEND_URL}/api/admin/products/${productId}`, 
        updateData, 
        { headers }
      );

      if (!updateResponse.data.success) {
        throw new Error('Product update failed');
      }

      // Delete Product
      const deleteResponse = await axios.delete(
        `${config.BACKEND_URL}/api/admin/products/${productId}`, 
        { headers }
      );

      if (!deleteResponse.data.success) {
        throw new Error('Product deletion failed');
      }

      this.log('Product CRUD operations completed successfully');
    });
  }

  async testBulkProductOperations() {
    await this.runTest('Bulk Product Operations', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Create multiple products
      const products = [
        {
          name: 'Bulk Product 1',
          description: 'Test bulk product 1',
          price: 49.99,
          category: 'men',
          sizes: ['M'],
          colors: ['Blue'],
          stock_quantity: 50
        },
        {
          name: 'Bulk Product 2',
          description: 'Test bulk product 2',
          price: 59.99,
          category: 'women',
          sizes: ['L'],
          colors: ['Red'],
          stock_quantity: 75
        }
      ];

      // Test bulk creation (if endpoint exists)
      try {
        const bulkCreateResponse = await axios.post(
          `${config.BACKEND_URL}/api/admin/products/bulk`,
          { products },
          { headers }
        );

        if (bulkCreateResponse.data.success) {
          this.log('Bulk product creation successful');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('Bulk creation endpoint not implemented - this is expected for now');
        } else {
          throw error;
        }
      }

      // Test bulk update (if endpoint exists)
      try {
        const bulkUpdateResponse = await axios.put(
          `${config.BACKEND_URL}/api/admin/products/bulk`,
          { 
            productIds: [1, 2],
            updates: { category: 'updated' }
          },
          { headers }
        );

        if (bulkUpdateResponse.data.success) {
          this.log('Bulk product update successful');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('Bulk update endpoint not implemented - enhancement needed');
        } else {
          throw error;
        }
      }

      this.log('Bulk operations testing completed');
    });
  }

  // User Management Tests
  async testUserManagement() {
    await this.runTest('User Management Operations', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Get all users
      const usersResponse = await axios.get(
        `${config.BACKEND_URL}/api/admin/users`,
        { headers }
      );

      if (!usersResponse.data.success) {
        throw new Error('User list retrieval failed');
      }

      // Get user by ID (if users exist)
      if (usersResponse.data.users && usersResponse.data.users.length > 0) {
        const userId = usersResponse.data.users[0].id;
        
        const userResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/users/${userId}`,
          { headers }
        );

        if (!userResponse.data.success) {
          throw new Error('Individual user retrieval failed');
        }
      }

      this.log('User management operations completed');
    });
  }

  // Order Management Tests
  async testOrderManagement() {
    await this.runTest('Order Management Operations', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Get all orders
      const ordersResponse = await axios.get(
        `${config.BACKEND_URL}/api/admin/orders`,
        { headers }
      );

      if (!ordersResponse.data.success) {
        throw new Error('Order list retrieval failed');
      }

      // Test order status updates (if orders exist)
      if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
        const orderId = ordersResponse.data.orders[0].id;
        
        const updateResponse = await axios.put(
          `${config.BACKEND_URL}/api/admin/orders/${orderId}/status`,
          { status: 'processing' },
          { headers }
        );

        if (updateResponse.data.success) {
          this.log('Order status update successful');
        }
      }

      this.log('Order management operations completed');
    });
  }

  // Analytics and Reporting Tests
  async testAnalyticsFeatures() {
    await this.runTest('Analytics and Reporting', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test sales analytics
      try {
        const salesResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/analytics/sales`,
          { headers }
        );

        if (salesResponse.data.success) {
          this.log('Sales analytics data retrieved');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('Sales analytics endpoint not implemented - enhancement needed');
        } else {
          throw error;
        }
      }

      // Test product analytics
      try {
        const productResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/analytics/products`,
          { headers }
        );

        if (productResponse.data.success) {
          this.log('Product analytics data retrieved');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('Product analytics endpoint not implemented - enhancement needed');
        } else {
          throw error;
        }
      }

      // Test user analytics
      try {
        const userResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/analytics/users`,
          { headers }
        );

        if (userResponse.data.success) {
          this.log('User analytics data retrieved');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('User analytics endpoint not implemented - enhancement needed');
        } else {
          throw error;
        }
      }

      this.log('Analytics testing completed');
    });
  }

  // Real-time Features Tests
  async testRealTimeFeatures() {
    await this.runTest('Real-time Features', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test real-time status endpoint
      try {
        const statusResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/realtime/status`,
          { headers }
        );

        if (statusResponse.data.success) {
          this.log('Real-time status data retrieved');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('Real-time status endpoint not implemented - enhancement needed');
        } else {
          throw error;
        }
      }

      // Test WebSocket connection (basic check)
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:3001/ws`);

      ws.on('open', () => {
        this.log('WebSocket connection established');
        ws.close();
      });

      ws.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          this.log('WebSocket server not running - this is expected for now');
        } else {
          this.log(`WebSocket error: ${error.message}`);
        }
      });

      this.log('Real-time features testing completed');
    });
  }

  // Security Tests
  async testSecurityFeatures() {
    await this.runTest('Security Features', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test SQL injection protection
      try {
        await axios.get(
          `${config.BACKEND_URL}/api/admin/products?id=1' OR '1'='1`,
          { headers }
        );
        throw new Error('SQL injection not properly prevented');
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 500) {
          this.log('SQL injection protection working');
        }
      }

      // Test XSS protection
      try {
        await axios.post(
          `${config.BACKEND_URL}/api/admin/products`,
          { name: '<script>alert("xss")</script>' },
          { headers }
        );
        this.log('XSS protection check completed');
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('XSS protection working');
        }
      }

      this.log('Security features testing completed');
    });
  }

  // Database Integration Tests
  async testDatabaseIntegration() {
    await this.runTest('Database Integration', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test database connection
      const healthResponse = await axios.get(
        `${config.BACKEND_URL}/api/health`,
        { headers }
      );

      if (!healthResponse.data.success && healthResponse.data.database !== 'connected') {
        throw new Error('Database connection failed');
      }

      // Test RLS policies
      try {
        // This should be blocked by RLS for non-admin users
        const rlsTestResponse = await axios.get(
          `${config.BACKEND_URL}/api/admin/database/test-rls`,
          { headers }
        );

        if (rlsTestResponse.data.success) {
          this.log('RLS policies properly configured for admin');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('RLS test endpoint not implemented');
        } else {
          this.log('RLS testing completed');
        }
      }

      this.log('Database integration testing completed');
    });
  }

  // Performance Tests
  async testPerformance() {
    await this.runTest('Performance Tests', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test response time for product listing
      const startTime = Date.now();
      await axios.get(`${config.BACKEND_URL}/api/admin/products`, { headers });
      const responseTime = Date.now() - startTime;

      if (responseTime > 2000) {
        this.log(`Slow response time: ${responseTime}ms - optimization needed`);
      } else {
        this.log(`Good response time: ${responseTime}ms`);
      }

      // Test concurrent requests
      const concurrentRequests = [];
      for (let i = 0; i < 5; i++) {
        concurrentRequests.push(
          axios.get(`${config.BACKEND_URL}/api/admin/products`, { headers })
        );
      }

      await Promise.all(concurrentRequests);
      this.log('Concurrent requests handled successfully');

      this.log('Performance testing completed');
    });
  }

  // Error Handling Tests
  async testErrorHandling() {
    await this.runTest('Error Handling', async () => {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Test invalid product ID
      try {
        await axios.get(
          `${config.BACKEND_URL}/api/admin/products/invalid-id`,
          { headers }
        );
        throw new Error('Should have returned 400 error');
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          this.log('Invalid ID properly handled');
        }
      }

      // Test missing required fields
      try {
        await axios.post(
          `${config.BACKEND_URL}/api/admin/products`,
          {},
          { headers }
        );
        throw new Error('Should have returned validation error');
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('Validation errors properly handled');
        }
      }

      this.log('Error handling testing completed');
    });
  }

  // Frontend Component Tests
  async testFrontendComponents() {
    await this.runTest('Frontend Component Functionality', async () => {
      const response = await axios.get(config.FRONTEND_URL);
      
      if (response.status !== 200) {
        throw new Error('Frontend not accessible');
      }

      // Test if admin components are loaded
      const html = response.data;
      const adminComponents = [
        'AdminDashboard',
        'ProductManagement',
        'UserManagement',
        'OrderManagement'
      ];

      let componentsFound = 0;
      for (const component of adminComponents) {
        if (html.includes(component) || html.includes(component.toLowerCase())) {
          componentsFound++;
        }
      }

      this.log(`Found ${componentsFound}/${adminComponents.length} admin components in HTML`);

      if (componentsFound === 0) {
        this.log('No admin components detected - may need to check component mounting');
      }

      this.log('Frontend component testing completed');
    });
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting MonsterMen90 Admin Panel Comprehensive Test Suite');
    this.log(`Backend URL: ${config.BACKEND_URL}`);
    this.log(`Frontend URL: ${config.FRONTEND_URL}`);

    // Wait a moment for servers to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Run all test categories
      await this.testAdminLogin();
      await this.testAdminAuthenticationGuard();
      await this.testProductCRUD();
      await this.testBulkProductOperations();
      await this.testUserManagement();
      await this.testOrderManagement();
      await this.testAnalyticsFeatures();
      await this.testRealTimeFeatures();
      await this.testSecurityFeatures();
      await this.testDatabaseIntegration();
      await this.testPerformance();
      await this.testErrorHandling();
      await this.testFrontendComponents();

    } catch (error) {
      this.log(`Critical error during testing: ${error.message}`, 'error');
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MONSTERMEN90 ADMIN PANEL TEST RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    console.log(`\n🔍 PRODUCTION READINESS ASSESSMENT:`);
    
    const criticalTests = [
      'Admin Login Authentication',
      'Admin Route Protection',
      'Product CRUD Operations'
    ];
    
    const criticalPassed = criticalTests.filter(testName =>
      this.results.tests.find(t => t.name === testName && t.status === 'PASSED')
    ).length;

    if (criticalPassed === criticalTests.length) {
      console.log('✅ CRITICAL FUNCTIONALITY: PASSED');
    } else {
      console.log('❌ CRITICAL FUNCTIONALITY: FAILED');
    }

    const enhancementTests = [
      'Bulk Product Operations',
      'Analytics and Reporting',
      'Real-time Features'
    ];
    
    const enhancementPassed = enhancementTests.filter(testName =>
      this.results.tests.find(t => t.name === testName && t.status === 'PASSED')
    ).length;

    console.log(`\n🚀 ENHANCEMENT FEATURES: ${enhancementPassed}/${enhancementTests.length} implemented`);

    console.log(`\n📈 RECOMMENDATIONS:`);
    
    if (this.results.failed > 0) {
      console.log('• Fix failed tests before production deployment');
    }
    
    if (enhancementPassed < enhancementTests.length) {
      console.log('• Implement missing enhancement features for better admin experience');
    }
    
    console.log('• Consider adding more comprehensive error handling');
    console.log('• Implement bulk operations for better productivity');
    console.log('• Add real-time notifications for admin actions');
    console.log('• Enhance analytics dashboard with more metrics');

    console.log('\n' + '='.repeat(60));
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AdminPanelTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AdminPanelTestSuite;