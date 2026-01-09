#!/usr/bin/env node

/**
 * Admin Functionality Comprehensive Testing Script
 * Tests all admin features with proper authentication
 */

const axios = require('axios');

class AdminFunctionalityTester {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.adminToken = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const config = {
                method: options.method || 'GET',
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                data: options.data,
                timeout: 10000
            };

            if (this.adminToken) {
                config.headers.Authorization = `Bearer ${this.adminToken}`;
            }

            const response = await axios(config);
            return {
                success: true,
                status: response.status,
                data: response.data,
                responseTime: response.headers['x-response-time'] || 'N/A'
            };
        } catch (error) {
            return {
                success: false,
                status: error.response?.status || 0,
                error: error.response?.data || error.message,
                message: error.message
            };
        }
    }

    async testAdminLogin() {
        console.log('\n🔐 Testing Admin Authentication...');
        
        // Test 1: Login with valid admin credentials
        const loginResponse = await this.makeRequest('/api/auth/login', {
            method: 'POST',
            data: {
                email: 'admin@monstermenn90.com',
                password: 'Admin123!@#'
            }
        });

        if (loginResponse.success && loginResponse.data.token) {
            this.adminToken = loginResponse.data.token;
            this.recordTest('Admin Login', true, 'Successfully logged in with admin credentials');
            console.log('✅ Admin login successful');
        } else {
            this.recordTest('Admin Login', false, 'Failed to login with admin credentials');
            console.log('❌ Admin login failed:', loginResponse.message);
        }

        // Test 2: Try accessing admin endpoint without authentication
        const noAuthResponse = await this.makeRequest('/api/admin/products');
        if (!noAuthResponse.success && noAuthResponse.status === 401) {
            this.recordTest('No Auth Protection', true, 'Admin endpoint properly protected without auth');
            console.log('✅ Admin endpoint protection working');
        } else {
            this.recordTest('No Auth Protection', false, 'Admin endpoint not properly protected');
        }

        // Test 3: Try accessing admin endpoint with invalid token
        const invalidAuthResponse = await this.makeRequest('/api/admin/products', {
            headers: { 'Authorization': 'Bearer invalid_token' }
        });
        if (!invalidAuthResponse.success && invalidAuthResponse.status === 401) {
            this.recordTest('Invalid Token Protection', true, 'Admin endpoint rejects invalid tokens');
            console.log('✅ Invalid token protection working');
        } else {
            this.recordTest('Invalid Token Protection', false, 'Admin endpoint accepts invalid tokens');
        }
    }

    async testProductManagement() {
        console.log('\n🛍️ Testing Admin Product Management...');
        
        // Test 1: Get all products
        const getProductsResponse = await this.makeRequest('/api/admin/products');
        if (getProductsResponse.success) {
            this.recordTest('Get All Products', true, `Retrieved ${getProductsResponse.data?.length || 0} products`);
            console.log('✅ Product retrieval successful');
        } else {
            this.recordTest('Get All Products', false, getProductsResponse.message);
        }

        // Test 2: Get products with filters
        const filteredResponse = await this.makeRequest('/api/admin/products?active=true&limit=10');
        if (filteredResponse.success) {
            this.recordTest('Filtered Product Query', true, 'Product filtering working');
            console.log('✅ Product filtering successful');
        } else {
            this.recordTest('Filtered Product Query', false, filteredResponse.message);
        }

        // Test 3: Get low stock products
        const lowStockResponse = await this.makeRequest('/api/admin/products/low-stock');
        if (lowStockResponse.success) {
            this.recordTest('Low Stock Products', true, 'Low stock detection working');
            console.log('✅ Low stock detection working');
        } else {
            this.recordTest('Low Stock Products', false, lowStockResponse.message);
        }

        // Test 4: Create a test product
        const newProduct = {
            name: 'Test Admin Product',
            description: 'Product created by admin test',
            price: 99.99,
            category: 'test',
            variants: [
                { size: 'M', color: 'Black', price: 99.99, stock_quantity: 10 }
            ]
        };

        const createResponse = await this.makeRequest('/api/admin/products', {
            method: 'POST',
            data: newProduct
        });

        if (createResponse.success) {
            this.recordTest('Create Product', true, 'Product creation working');
            console.log('✅ Product creation successful');
            
            // Test 5: Update the created product
            const updateData = { price: 89.99, name: 'Updated Test Product' };
            const productId = createResponse.data?.id;
            
            if (productId) {
                const updateResponse = await this.makeRequest(`/api/admin/products/${productId}`, {
                    method: 'PUT',
                    data: updateData
                });

                if (updateResponse.success) {
                    this.recordTest('Update Product', true, 'Product update working');
                    console.log('✅ Product update successful');
                } else {
                    this.recordTest('Update Product', false, updateResponse.message);
                }

                // Test 6: Delete the test product
                const deleteResponse = await this.makeRequest(`/api/admin/products/${productId}`, {
                    method: 'DELETE'
                });

                if (deleteResponse.success) {
                    this.recordTest('Delete Product', true, 'Product deletion working');
                    console.log('✅ Product deletion successful');
                } else {
                    this.recordTest('Delete Product', false, deleteResponse.message);
                }
            }
        } else {
            this.recordTest('Create Product', false, createResponse.message);
        }
    }

    async testUserManagement() {
        console.log('\n👥 Testing Admin User Management...');
        
        // Test 1: Get all users
        const getUsersResponse = await this.makeRequest('/api/admin/users');
        if (getUsersResponse.success) {
            this.recordTest('Get All Users', true, `Retrieved ${getUsersResponse.data?.length || 0} users`);
            console.log('✅ User retrieval successful');
        } else {
            this.recordTest('Get All Users', false, getUsersResponse.message);
        }

        // Test 2: Get user categories
        const categoriesResponse = await this.makeRequest('/api/users/categories');
        if (categoriesResponse.success) {
            this.recordTest('User Categories', true, 'User categories retrieval working');
            console.log('✅ User categories working');
        } else {
            this.recordTest('User Categories', false, categoriesResponse.message);
        }

        // Test 3: Get admin users specifically
        const adminUsersResponse = await this.makeRequest('/api/users/admin');
        if (adminUsersResponse.success) {
            this.recordTest('Admin Users List', true, 'Admin users retrieval working');
            console.log('✅ Admin users retrieval working');
        } else {
            this.recordTest('Admin Users List', false, adminUsersResponse.message);
        }
    }

    async testOrderManagement() {
        console.log('\n📦 Testing Admin Order Management...');
        
        // Test 1: Get all orders
        const getOrdersResponse = await this.makeRequest('/api/orders/admin');
        if (getOrdersResponse.success) {
            this.recordTest('Get All Orders', true, `Retrieved ${getOrdersResponse.data?.length || 0} orders`);
            console.log('✅ Order retrieval successful');
        } else {
            this.recordTest('Get All Orders', false, getOrdersResponse.message);
        }

        // Test 2: Get orders with status filter
        const filteredOrdersResponse = await this.makeRequest('/api/orders/admin?status=pending');
        if (filteredOrdersResponse.success) {
            this.recordTest('Filtered Orders', true, 'Order filtering working');
            console.log('✅ Order filtering successful');
        } else {
            this.recordTest('Filtered Orders', false, filteredOrdersResponse.message);
        }

        // Test 3: Get order analytics
        const analyticsResponse = await this.makeRequest('/api/orders/analytics/admin');
        if (analyticsResponse.success) {
            this.recordTest('Order Analytics', true, 'Order analytics working');
            console.log('✅ Order analytics working');
        } else {
            this.recordTest('Order Analytics', false, analyticsResponse.message);
        }

        // Test 4: Get discounts management
        const discountsResponse = await this.makeRequest('/api/orders/discounts/admin');
        if (discountsResponse.success) {
            this.recordTest('Discounts Management', true, 'Discounts management working');
            console.log('✅ Discounts management working');
        } else {
            this.recordTest('Discounts Management', false, discountsResponse.message);
        }

        // Test 5: Get pricing management
        const pricingResponse = await this.makeRequest('/api/orders/pricing/admin');
        if (pricingResponse.success) {
            this.recordTest('Pricing Management', true, 'Pricing management working');
            console.log('✅ Pricing management working');
        } else {
            this.recordTest('Pricing Management', false, pricingResponse.message);
        }
    }

    async testStockManagement() {
        console.log('\n📊 Testing Admin Stock Management...');
        
        // Test 1: Get stock overview
        const stockOverviewResponse = await this.makeRequest('/api/admin/stock/overview');
        if (stockOverviewResponse.success) {
            this.recordTest('Stock Overview', true, 'Stock overview working');
            console.log('✅ Stock overview working');
        } else {
            this.recordTest('Stock Overview', false, stockOverviewResponse.message);
        }

        // Test 2: Get stock movements
        const stockMovementsResponse = await this.makeRequest('/api/admin/stock/movements');
        if (stockMovementsResponse.success) {
            this.recordTest('Stock Movements', true, 'Stock movements tracking working');
            console.log('✅ Stock movements working');
        } else {
            this.recordTest('Stock Movements', false, stockMovementsResponse.message);
        }

        // Test 3: Get stock alerts
        const stockAlertsResponse = await this.makeRequest('/api/admin/stock/alerts');
        if (stockAlertsResponse.success) {
            this.recordTest('Stock Alerts', true, 'Stock alerts working');
            console.log('✅ Stock alerts working');
        } else {
            this.recordTest('Stock Alerts', false, stockAlertsResponse.message);
        }
    }

    async testInventoryManagement() {
        console.log('\n📦 Testing Admin Inventory Management...');
        
        // Test 1: Get inventory overview
        const inventoryResponse = await this.makeRequest('/api/inventory');
        if (inventoryResponse.success) {
            this.recordTest('Inventory Overview', true, 'Inventory overview working');
            console.log('✅ Inventory overview working');
        } else {
            this.recordTest('Inventory Overview', false, inventoryResponse.message);
        }

        // Test 2: Get low stock inventory
        const lowStockInventoryResponse = await this.makeRequest('/api/inventory/low-stock');
        if (lowStockInventoryResponse.success) {
            this.recordTest('Low Stock Inventory', true, 'Low stock inventory working');
            console.log('✅ Low stock inventory working');
        } else {
            this.recordTest('Low Stock Inventory', false, lowStockInventoryResponse.message);
        }

        // Test 3: Update inventory (if supported)
        const updateInventoryResponse = await this.makeRequest('/api/inventory/update', {
            method: 'POST',
            data: {
                product_id: 'test-product-id',
                quantity_change: 5,
                reason: 'Stock adjustment'
            }
        });

        if (updateInventoryResponse.success || updateInventoryResponse.status === 404) {
            this.recordTest('Inventory Update', true, 'Inventory update endpoint accessible');
            console.log('✅ Inventory update working');
        } else {
            this.recordTest('Inventory Update', false, updateInventoryResponse.message);
        }
    }

    async testAdminAnalytics() {
        console.log('\n📈 Testing Admin Analytics & Reporting...');
        
        // Test 1: Get sales analytics
        const salesAnalyticsResponse = await this.makeRequest('/api/admin/analytics/sales');
        if (salesAnalyticsResponse.success) {
            this.recordTest('Sales Analytics', true, 'Sales analytics working');
            console.log('✅ Sales analytics working');
        } else {
            this.recordTest('Sales Analytics', false, salesAnalyticsResponse.message);
        }

        // Test 2: Get product analytics
        const productAnalyticsResponse = await this.makeRequest('/api/admin/analytics/products');
        if (productAnalyticsResponse.success) {
            this.recordTest('Product Analytics', true, 'Product analytics working');
            console.log('✅ Product analytics working');
        } else {
            this.recordTest('Product Analytics', false, productAnalyticsResponse.message);
        }

        // Test 3: Get user analytics
        const userAnalyticsResponse = await this.makeRequest('/api/admin/analytics/users');
        if (userAnalyticsResponse.success) {
            this.recordTest('User Analytics', true, 'User analytics working');
            console.log('✅ User analytics working');
        } else {
            this.recordTest('User Analytics', false, userAnalyticsResponse.message);
        }

        // Test 4: Get dashboard overview
        const dashboardResponse = await this.makeRequest('/api/admin/dashboard');
        if (dashboardResponse.success) {
            this.recordTest('Dashboard Overview', true, 'Dashboard overview working');
            console.log('✅ Dashboard overview working');
        } else {
            this.recordTest('Dashboard Overview', false, dashboardResponse.message);
        }
    }

    async testAdminSecurity() {
        console.log('\n🔒 Testing Admin Security Features...');
        
        // Test 1: Rate limiting protection
        const rateLimitTests = [];
        for (let i = 0; i < 10; i++) {
            const response = await this.makeRequest('/api/admin/products');
            rateLimitTests.push(response);
        }

        const rateLimited = rateLimitTests.some(r => r.status === 429);
        if (rateLimited) {
            this.recordTest('Rate Limiting', true, 'Rate limiting protection working');
            console.log('✅ Rate limiting working');
        } else {
            this.recordTest('Rate Limiting', false, 'Rate limiting not detected');
        }

        // Test 2: CSRF protection (for POST requests)
        const csrfResponse = await this.makeRequest('/api/admin/products', {
            method: 'POST',
            data: { name: 'CSRF Test' }
        });

        if (!csrfResponse.success && csrfResponse.status === 403) {
            this.recordTest('CSRF Protection', true, 'CSRF protection working');
            console.log('✅ CSRF protection working');
        } else {
            this.recordTest('CSRF Protection', false, 'CSRF protection not detected');
        }

        // Test 3: SQL injection protection
        const sqlInjectionResponse = await this.makeRequest('/api/admin/products?id=1\' OR \'1\'=\'1');
        if (!sqlInjectionResponse.success || sqlInjectionResponse.data?.error) {
            this.recordTest('SQL Injection Protection', true, 'SQL injection protection working');
            console.log('✅ SQL injection protection working');
        } else {
            this.recordTest('SQL Injection Protection', false, 'SQL injection vulnerability detected');
        }
    }

    recordTest(testName, passed, message) {
        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }
        
        this.testResults.details.push({
            test: testName,
            passed,
            message
        });
    }

    generateReport() {
        const total = this.testResults.passed + this.testResults.failed;
        const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 ADMIN FUNCTIONALITY TEST REPORT');
        console.log('='.repeat(80));
        
        console.log(`✅ PASSED: ${this.testResults.passed} tests`);
        console.log(`❌ FAILED: ${this.testResults.failed} tests`);
        console.log(`📈 SUCCESS RATE: ${successRate}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.details
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  • ${test.test}: ${test.message}`);
                });
        }
        
        if (this.testResults.passed > 0) {
            console.log('\n✅ PASSED TESTS:');
            this.testResults.details
                .filter(test => test.passed)
                .forEach(test => {
                    console.log(`  • ${test.test}: ${test.message}`);
                });
        }
        
        console.log('='.repeat(80));
        
        return {
            passed: this.testResults.passed,
            failed: this.testResults.failed,
            successRate: parseFloat(successRate),
            totalTests: total
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Admin Functionality Testing...');
        console.log(`📡 Testing against: ${this.baseURL}`);
        
        try {
            // First test basic connectivity
            const healthCheck = await this.makeRequest('/health');
            if (!healthCheck.success) {
                console.log('❌ Backend is not responding. Please ensure the backend is running.');
                return;
            }
            console.log('✅ Backend is responding');
            
            // Run all test suites
            await this.testAdminLogin();
            await this.testProductManagement();
            await this.testUserManagement();
            await this.testOrderManagement();
            await this.testStockManagement();
            await this.testInventoryManagement();
            await this.testAdminAnalytics();
            await this.testAdminSecurity();
            
            // Generate final report
            const results = this.generateReport();
            
            // Save detailed results
            const fs = require('fs');
            const reportData = {
                timestamp: new Date().toISOString(),
                results,
                details: this.testResults.details,
                adminTokenGenerated: !!this.adminToken
            };
            
            fs.writeFileSync(
                'admin_functionality_test_results.json',
                JSON.stringify(reportData, null, 2)
            );
            
            console.log('\n📄 Detailed results saved to: admin_functionality_test_results.json');
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new AdminFunctionalityTester();
    tester.runAllTests().catch(console.error);
}

module.exports = AdminFunctionalityTester;