#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for MonsterMen90 E-commerce Platform
 * Tests all API endpoints for functionality, security, and error handling
 */

const API_BASE = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Utility functions for testing
const logTest = (status, endpoint, message, details = null) => {
    const result = {
        endpoint,
        message,
        details,
        timestamp: new Date().toISOString()
    };
    
    if (status === 'PASS') {
        testResults.passed.push(result);
        console.log(`✅ PASS: ${endpoint} - ${message}`);
    } else if (status === 'FAIL') {
        testResults.failed.push(result);
        console.log(`❌ FAIL: ${endpoint} - ${message}`);
    } else if (status === 'WARN') {
        testResults.warnings.push(result);
        console.log(`⚠️  WARN: ${endpoint} - ${message}`);
    }
};

const makeRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        const data = await response.json();
        return {
            status: response.status,
            ok: response.ok,
            data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message,
            data: null
        };
    }
};

// Test suites
class APITester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.warnings = 0;
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive API Testing for MonsterMen90\n');
        
        await this.testBasicEndpoints();
        await this.testProductsAPI();
        await this.testAdminProductsAPI();
        await this.testUserManagementAPI();
        await this.testOrderManagementAPI();
        await this.testInventoryAPI();
        await this.testStockManagementAPI();
        await this.testErrorHandling();
        await this.testSecurityHeaders();
        await this.testPerformance();
        
        this.generateReport();
    }

    async testBasicEndpoints() {
        console.log('\n📋 Testing Basic Endpoints...\n');
        
        // Health check
        const healthResponse = await makeRequest(`${BASE_URL}/health`);
        if (healthResponse.ok && healthResponse.data.database === 'Connected') {
            logTest('PASS', 'GET /health', 'Health check working, database connected');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /health', 'Health check failed or database not connected');
            this.failed++;
        }

        // API information
        const apiResponse = await makeRequest(`${BASE_URL}/api`);
        if (apiResponse.ok && apiResponse.data.success && apiResponse.data.capabilities) {
            logTest('PASS', 'GET /api', 'API information endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api', 'API information endpoint failed');
            this.failed++;
        }

        // Schema information
        const schemaResponse = await makeRequest(`${BASE_URL}/api/schema`);
        if (schemaResponse.ok) {
            logTest('PASS', 'GET /api/schema', 'Schema information endpoint working');
            this.passed++;
        } else {
            logTest('WARN', 'GET /api/schema', 'Schema information endpoint not available');
            this.warnings++;
        }

        // Tables information
        const tablesResponse = await makeRequest(`${BASE_URL}/api/tables`);
        if (tablesResponse.ok) {
            logTest('PASS', 'GET /api/tables', 'Tables information endpoint working');
            this.passed++;
        } else {
            logTest('WARN', 'GET /api/tables', 'Tables information endpoint not available');
            this.warnings++;
        }
    }

    async testProductsAPI() {
        console.log('\n🛍️  Testing Products API...\n');
        
        // Get all products (public)
        const productsResponse = await makeRequest(`${API_BASE}/products`);
        if (productsResponse.ok && productsResponse.data.products) {
            logTest('PASS', 'GET /api/products', `Retrieved ${productsResponse.data.products.length} products`);
            this.passed++;
            
            // Test pagination
            if (productsResponse.data.hasMore !== undefined) {
                logTest('PASS', 'GET /api/products', 'Pagination information present');
                this.passed++;
            }
        } else {
            logTest('FAIL', 'GET /api/products', 'Failed to retrieve products');
            this.failed++;
        }

        // Get single product (if products exist)
        if (productsResponse.ok && productsResponse.data.products?.length > 0) {
            const productId = productsResponse.data.products[0].id;
            const singleProductResponse = await makeRequest(`${API_BASE}/products/${productId}`);
            if (singleProductResponse.ok) {
                logTest('PASS', `GET /api/products/${productId}`, 'Single product retrieval working');
                this.passed++;
            } else {
                logTest('FAIL', `GET /api/products/${productId}`, 'Single product retrieval failed');
                this.failed++;
            }
        }

        // Get featured products
        const featuredResponse = await makeRequest(`${API_BASE}/products/featured/4`);
        if (featuredResponse.ok) {
            logTest('PASS', 'GET /api/products/featured/4', 'Featured products endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/products/featured/4', 'Featured products endpoint failed');
            this.failed++;
        }

        // Search products
        const searchResponse = await makeRequest(`${API_BASE}/products/search/cotton`);
        if (searchResponse.ok) {
            logTest('PASS', 'GET /api/products/search/cotton', 'Product search endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/products/search/cotton', 'Product search endpoint failed');
            this.failed++;
        }

        // Get categories
        const categoriesResponse = await makeRequest(`${API_BASE}/users/categories`);
        if (categoriesResponse.ok && categoriesResponse.data.data) {
            logTest('PASS', 'GET /api/users/categories', `Retrieved ${categoriesResponse.data.data.length} categories`);
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/users/categories', 'Categories retrieval failed');
            this.failed++;
        }
    }

    async testAdminProductsAPI() {
        console.log('\n👨‍💼 Testing Admin Products API...\n');
        
        // Get all admin products
        const adminProductsResponse = await makeRequest(`${API_BASE}/admin/products`);
        if (adminProductsResponse.ok && adminProductsResponse.data.products) {
            logTest('PASS', 'GET /api/admin/products', `Retrieved ${adminProductsResponse.data.products.length} admin products`);
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/products', 'Admin products retrieval failed');
            this.failed++;
        }

        // Test admin products with filters
        const filterResponse = await makeRequest(`${API_BASE}/admin/products?active=true&limit=10`);
        if (filterResponse.ok) {
            logTest('PASS', 'GET /api/admin/products?active=true', 'Admin products filtering working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/products?active=true', 'Admin products filtering failed');
            this.failed++;
        }

        // Test product variants endpoint
        if (adminProductsResponse.ok && adminProductsResponse.data.products?.length > 0) {
            const productId = adminProductsResponse.data.products[0].id;
            const variantsResponse = await makeRequest(`${API_BASE}/admin/products/${productId}/variants`);
            if (variantsResponse.ok) {
                logTest('PASS', `GET /api/admin/products/${productId}/variants`, 'Product variants endpoint working');
                this.passed++;
            } else {
                logTest('FAIL', `GET /api/admin/products/${productId}/variants`, 'Product variants endpoint failed');
                this.failed++;
            }
        }

        // Test low stock endpoint
        const lowStockResponse = await makeRequest(`${API_BASE}/admin/products/low-stock`);
        if (lowStockResponse.ok) {
            logTest('PASS', 'GET /api/admin/products/low-stock', 'Low stock endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/products/low-stock', 'Low stock endpoint failed');
            this.failed++;
        }
    }

    async testUserManagementAPI() {
        console.log('\n👥 Testing User Management API...\n');
        
        // Get all users (admin)
        const usersResponse = await makeRequest(`${API_BASE}/users/admin`);
        if (usersResponse.ok) {
            logTest('PASS', 'GET /api/users/admin', 'Admin users endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/users/admin', 'Admin users endpoint failed');
            this.failed++;
        }

        // Get all categories (public)
        const categoriesResponse = await makeRequest(`${API_BASE}/users/categories`);
        if (categoriesResponse.ok) {
            logTest('PASS', 'GET /api/users/categories', 'Public categories endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/users/categories', 'Public categories endpoint failed');
            this.failed++;
        }
    }

    async testOrderManagementAPI() {
        console.log('\n📦 Testing Order Management API...\n');
        
        // Get all orders (admin)
        const ordersResponse = await makeRequest(`${API_BASE}/orders/admin`);
        if (ordersResponse.ok) {
            logTest('PASS', 'GET /api/orders/admin', 'Admin orders endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/orders/admin', 'Admin orders endpoint failed');
            this.failed++;
        }

        // Test order filtering
        const filteredOrdersResponse = await makeRequest(`${API_BASE}/orders/admin?status=pending`);
        if (filteredOrdersResponse.ok) {
            logTest('PASS', 'GET /api/orders/admin?status=pending', 'Order filtering working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/orders/admin?status=pending', 'Order filtering failed');
            this.failed++;
        }

        // Test discounts endpoint
        const discountsResponse = await makeRequest(`${API_BASE}/orders/discounts/admin`);
        if (discountsResponse.ok) {
            logTest('PASS', 'GET /api/orders/discounts/admin', 'Discounts endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/orders/discounts/admin', 'Discounts endpoint failed');
            this.failed++;
        }

        // Test pricing endpoint
        const pricingResponse = await makeRequest(`${API_BASE}/orders/pricing/admin`);
        if (pricingResponse.ok) {
            logTest('PASS', 'GET /api/orders/pricing/admin', 'Pricing endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/orders/pricing/admin', 'Pricing endpoint failed');
            this.failed++;
        }
    }

    async testInventoryAPI() {
        console.log('\n📊 Testing Inventory API...\n');
        
        // Get all inventory
        const inventoryResponse = await makeRequest(`${API_BASE}/inventory`);
        if (inventoryResponse.ok) {
            logTest('PASS', 'GET /api/inventory', 'Inventory endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/inventory', 'Inventory endpoint failed');
            this.failed++;
        }

        // Get low stock items
        const lowStockResponse = await makeRequest(`${API_BASE}/inventory/low-stock`);
        if (lowStockResponse.ok) {
            logTest('PASS', 'GET /api/inventory/low-stock', 'Low stock inventory endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/inventory/low-stock', 'Low stock inventory endpoint failed');
            this.failed++;
        }
    }

    async testStockManagementAPI() {
        console.log('\n📈 Testing Stock Management API...\n');
        
        // Get stock overview
        const stockOverviewResponse = await makeRequest(`${API_BASE}/admin/stock/overview`);
        if (stockOverviewResponse.ok && stockOverviewResponse.data.data) {
            const stockData = stockOverviewResponse.data.data;
            logTest('PASS', 'GET /api/admin/stock/overview', `Stock overview working with ${stockData.length} products`);
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/stock/overview', 'Stock overview endpoint failed');
            this.failed++;
        }

        // Get stock movements
        const movementsResponse = await makeRequest(`${API_BASE}/admin/stock/movements`);
        if (movementsResponse.ok) {
            logTest('PASS', 'GET /api/admin/stock/movements', 'Stock movements endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/stock/movements', 'Stock movements endpoint failed');
            this.failed++;
        }

        // Get stock alerts
        const alertsResponse = await makeRequest(`${API_BASE}/admin/stock/alerts`);
        if (alertsResponse.ok) {
            logTest('PASS', 'GET /api/admin/stock/alerts', 'Stock alerts endpoint working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/admin/stock/alerts', 'Stock alerts endpoint failed');
            this.failed++;
        }
    }

    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...\n');
        
        // Test 404 for non-existent endpoint
        const notFoundResponse = await makeRequest(`${API_BASE}/nonexistent-endpoint`);
        if (!notFoundResponse.ok && notFoundResponse.status === 404) {
            logTest('PASS', 'GET /api/nonexistent-endpoint', '404 error handling working correctly');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/nonexistent-endpoint', '404 error handling not working');
            this.failed++;
        }

        // Test 404 for non-existent product
        const invalidProductResponse = await makeRequest(`${API_BASE}/products/invalid-uuid`);
        if (!invalidProductResponse.ok) {
            logTest('PASS', 'GET /api/products/invalid-uuid', 'Invalid product ID handling working');
            this.passed++;
        } else {
            logTest('FAIL', 'GET /api/products/invalid-uuid', 'Invalid product ID not handled properly');
            this.failed++;
        }
    }

    async testSecurityHeaders() {
        console.log('\n🔒 Testing Security Headers...\n');
        
        const healthResponse = await makeRequest(`${BASE_URL}/health`);
        const headers = healthResponse.headers;
        
        // Check for security headers
        if (headers['content-type']) {
            logTest('PASS', 'Security Headers', 'Content-Type header present');
            this.passed++;
        } else {
            logTest('WARN', 'Security Headers', 'Content-Type header missing');
            this.warnings++;
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance...\n');
        
        await this.testResponseTimeAnalysis();
        await this.testConcurrentLoad();
        await this.testThroughput();
        await this.testMemoryUsage();
        await this.testDatabasePerformance();
        await this.testEndpointPerformanceComparison();
        await this.testResourceUtilization();
    }

    async testResponseTimeAnalysis() {
        console.log('📊 Response Time Analysis...');
        
        const endpoints = [
            { name: 'Health Check', url: `${BASE_URL}/health` },
            { name: 'Products API', url: `${API_BASE}/products` },
            { name: 'Admin Products', url: `${API_BASE}/admin/products` },
            { name: 'Users Admin', url: `${API_BASE}/users/admin` },
            { name: 'Orders Admin', url: `${API_BASE}/orders/admin` },
            { name: 'Inventory', url: `${API_BASE}/inventory` },
            { name: 'Stock Overview', url: `${API_BASE}/admin/stock/overview` }
        ];
        
        const performanceResults = [];
        
        for (const endpoint of endpoints) {
            const times = [];
            const iterations = 5;
            
            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const response = await makeRequest(endpoint.url);
                const endTime = Date.now();
                
                if (response.ok) {
                    times.push(endTime - startTime);
                }
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (times.length > 0) {
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);
                
                performanceResults.push({
                    endpoint: endpoint.name,
                    avgTime,
                    minTime,
                    maxTime,
                    times
                });
                
                // Determine performance level
                let status = 'PASS';
                let message = `Avg: ${avgTime.toFixed(1)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`;
                
                if (avgTime > 2000) {
                    status = 'FAIL';
                } else if (avgTime > 1000) {
                    status = 'WARN';
                }
                
                logTest(status, `Performance - ${endpoint.name}`, message);
                if (status === 'PASS') this.passed++;
                else if (status === 'WARN') this.warnings++;
                else this.failed++;
            }
        }
        
        // Performance comparison
        const fastestEndpoint = performanceResults.reduce((prev, current) => 
            (prev.avgTime < current.avgTime) ? prev : current
        );
        const slowestEndpoint = performanceResults.reduce((prev, current) => 
            (prev.avgTime > current.avgTime) ? prev : current
        );
        
        console.log(`   Fastest: ${fastestEndpoint.endpoint} (${fastestEndpoint.avgTime.toFixed(1)}ms)`);
        console.log(`   Slowest: ${slowestEndpoint.endpoint} (${slowestEndpoint.avgTime.toFixed(1)}ms)`);
        console.log(`   Performance Gap: ${(slowestEndpoint.avgTime - fastestEndpoint.avgTime).toFixed(1)}ms`);
    }

    async testConcurrentLoad() {
        console.log('\n🔥 Concurrent Load Testing...');
        
        const concurrentRequests = [5, 10, 20];
        const testEndpoint = `${API_BASE}/products`;
        
        for (const concurrency of concurrentRequests) {
            console.log(`   Testing ${concurrency} concurrent requests...`);
            
            const startTime = Date.now();
            const promises = [];
            
            for (let i = 0; i < concurrency; i++) {
                promises.push(makeRequest(testEndpoint));
            }
            
            const responses = await Promise.all(promises);
            const endTime = Date.now();
            
            const totalTime = endTime - startTime;
            const successfulRequests = responses.filter(r => r.ok).length;
            const failedRequests = concurrency - successfulRequests;
            const throughput = (successfulRequests / totalTime) * 1000; // requests per second
            
            let status = 'PASS';
            let message = `Concurrency: ${concurrency}, Success: ${successfulRequests}/${concurrency}, Throughput: ${throughput.toFixed(1)} req/s, Total Time: ${totalTime}ms`;
            
            if (failedRequests > 0) {
                status = 'WARN';
                message += `, Failed: ${failedRequests}`;
            }
            
            if (totalTime > 10000 || failedRequests > concurrency * 0.2) {
                status = 'FAIL';
            }
            
            logTest(status, `Concurrent Load - ${concurrency} requests`, message);
            if (status === 'PASS') this.passed++;
            else if (status === 'WARN') this.warnings++;
            else this.failed++;
        }
    }

    async testThroughput() {
        console.log('\n📈 Throughput Testing...');
        
        const endpoints = [
            { name: 'Health', url: `${BASE_URL}/health`, duration: 5000 },
            { name: 'Products', url: `${API_BASE}/products`, duration: 10000 },
            { name: 'Inventory', url: `${API_BASE}/inventory`, duration: 10000 }
        ];
        
        for (const endpoint of endpoints) {
            console.log(`   Testing throughput for ${endpoint.name}...`);
            
            const startTime = Date.now();
            const endTime = startTime + endpoint.duration;
            let requestCount = 0;
            let successCount = 0;
            
            while (Date.now() < endTime) {
                const response = await makeRequest(endpoint.url);
                requestCount++;
                
                if (response.ok) {
                    successCount++;
                }
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            const actualDuration = Date.now() - startTime;
            const throughput = (successCount / actualDuration) * 1000; // requests per second
            const successRate = (successCount / requestCount) * 100;
            
            let status = 'PASS';
            let message = `Requests: ${requestCount}, Success: ${successCount}, Throughput: ${throughput.toFixed(1)} req/s, Success Rate: ${successRate.toFixed(1)}%`;
            
            if (successRate < 95) {
                status = 'FAIL';
            } else if (successRate < 98) {
                status = 'WARN';
            }
            
            logTest(status, `Throughput - ${endpoint.name}`, message);
            if (status === 'PASS') this.passed++;
            else if (status === 'WARN') this.warnings++;
            else this.failed++;
        }
    }

    async testMemoryUsage() {
        console.log('\n💾 Memory Usage Testing...');
        
        // Test memory usage under load
        const initialMemory = process.memoryUsage();
        
        // Simulate memory-intensive operations
        const memoryTestData = [];
        const iterations = 100;
        
        for (let i = 0; i < iterations; i++) {
            // Make multiple requests and store responses
            const promises = [
                makeRequest(`${API_BASE}/products`),
                makeRequest(`${API_BASE}/admin/products`),
                makeRequest(`${API_BASE}/inventory`),
                makeRequest(`${API_BASE}/admin/stock/overview`)
            ];
            
            const responses = await Promise.all(promises);
            memoryTestData.push(...responses.filter(r => r.ok).map(r => r.data));
            
            // Periodic cleanup
            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = {
            heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
            heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
            external: finalMemory.external - initialMemory.external,
            rss: finalMemory.rss - initialMemory.rss
        };
        
        // Convert to MB
        const heapUsedMB = (memoryIncrease.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = (memoryIncrease.rss / 1024 / 1024).toFixed(2);
        
        let status = 'PASS';
        let message = `Heap Increase: ${heapUsedMB}MB, RSS Increase: ${rssMB}MB`;
        
        if (memoryIncrease.heapUsed > 50 * 1024 * 1024) { // 50MB
            status = 'WARN';
        }
        if (memoryIncrease.heapUsed > 100 * 1024 * 1024) { // 100MB
            status = 'FAIL';
        }
        
        logTest(status, 'Memory Usage', message);
        if (status === 'PASS') this.passed++;
        else if (status === 'WARN') this.warnings++;
        else this.failed++;
        
        // Clean up test data
        memoryTestData.length = 0;
        
        if (global.gc) {
            global.gc();
            const afterGCMemory = process.memoryUsage();
            const cleanedHeap = ((initialMemory.heapUsed - afterGCMemory.heapUsed) / 1024 / 1024).toFixed(2);
            console.log(`   Memory after GC: ${cleanedHeap}MB reclaimed`);
        }
    }

    async testDatabasePerformance() {
        console.log('\n🗄️ Database Performance Testing...');
        
        // Test database-heavy endpoints
        const dbEndpoints = [
            { name: 'Products with Variants', url: `${API_BASE}/admin/products` },
            { name: 'Stock Overview', url: `${API_BASE}/admin/stock/overview` },
            { name: 'Inventory Details', url: `${API_BASE}/inventory` },
            { name: 'Orders with Filtering', url: `${API_BASE}/orders/admin?status=pending` }
        ];
        
        for (const endpoint of dbEndpoints) {
            console.log(`   Testing database performance for ${endpoint.name}...`);
            
            const times = [];
            const iterations = 3;
            
            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const response = await makeRequest(endpoint.url);
                const endTime = Date.now();
                
                if (response.ok) {
                    times.push(endTime - startTime);
                }
                
                // Wait between database queries
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (times.length > 0) {
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                
                let status = 'PASS';
                let message = `Avg DB Query Time: ${avgTime.toFixed(1)}ms`;
                
                if (avgTime > 3000) {
                    status = 'FAIL';
                } else if (avgTime > 1500) {
                    status = 'WARN';
                }
                
                logTest(status, `DB Performance - ${endpoint.name}`, message);
                if (status === 'PASS') this.passed++;
                else if (status === 'WARN') this.warnings++;
                else this.failed++;
            }
        }
    }

    async testEndpointPerformanceComparison() {
        console.log('\n⚖️ Endpoint Performance Comparison...');
        
        // Test similar endpoints to compare performance
        const endpointPairs = [
            {
                name: 'Products Data Access',
                endpoints: [
                    { name: 'Public Products', url: `${API_BASE}/products` },
                    { name: 'Admin Products', url: `${API_BASE}/admin/products` }
                ]
            },
            {
                name: 'Stock Data Access',
                endpoints: [
                    { name: 'General Inventory', url: `${API_BASE}/inventory` },
                    { name: 'Admin Stock Overview', url: `${API_BASE}/admin/stock/overview` }
                ]
            }
        ];
        
        for (const pair of endpointPairs) {
            console.log(`   Comparing ${pair.name} endpoints...`);
            
            const results = [];
            
            for (const endpoint of pair.endpoints) {
                const times = [];
                for (let i = 0; i < 3; i++) {
                    const startTime = Date.now();
                    const response = await makeRequest(endpoint.url);
                    const endTime = Date.now();
                    
                    if (response.ok) {
                        times.push(endTime - startTime);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                if (times.length > 0) {
                    results.push({
                        name: endpoint.name,
                        avgTime: times.reduce((a, b) => a + b, 0) / times.length
                    });
                }
            }
            
            if (results.length === 2) {
                const [first, second] = results;
                const difference = Math.abs(first.avgTime - second.avgTime);
                const percentageDiff = (difference / Math.min(first.avgTime, second.avgTime)) * 100;
                
                let status = 'PASS';
                let message = `${first.name}: ${first.avgTime.toFixed(1)}ms vs ${second.name}: ${second.avgTime.toFixed(1)}ms (${percentageDiff.toFixed(1)}% difference)`;
                
                if (percentageDiff > 50) {
                    status = 'WARN';
                    message += ' - Significant performance difference detected';
                }
                
                logTest(status, `Performance Comparison - ${pair.name}`, message);
                if (status === 'PASS') this.passed++;
                else this.warnings++;
            }
        }
    }

    async testResourceUtilization() {
        console.log('\n📊 Resource Utilization Analysis...');
        
        // Monitor resource usage during various operations
        const initialMetrics = {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
        
        // Simulate various API operations
        const operations = [
            () => makeRequest(`${API_BASE}/products`),
            () => makeRequest(`${API_BASE}/admin/products`),
            () => makeRequest(`${API_BASE}/inventory`),
            () => makeRequest(`${API_BASE}/admin/stock/overview`),
            () => makeRequest(`${API_BASE}/orders/admin`)
        ];
        
        const startTime = Date.now();
        
        // Execute operations in sequence to monitor resource usage
        for (const operation of operations) {
            await operation();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const endTime = Date.now();
        const finalMetrics = {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(initialMetrics.cpu)
        };
        
        const operationTime = endTime - startTime;
        const memoryIncrease = finalMetrics.memory.heapUsed - initialMetrics.memory.heapUsed;
        const cpuTime = finalMetrics.cpu.user + finalMetrics.cpu.system;
        
        // Calculate efficiency metrics
        const operationsPerSecond = (operations.length / operationTime) * 1000;
        const memoryPerOperation = memoryIncrease / operations.length;
        const cpuPerOperation = cpuTime / operations.length;
        
        const efficiencyScore = this.calculateEfficiencyScore({
            operationsPerSecond,
            memoryPerOperation,
            cpuPerOperation,
            operationTime
        });
        
        let status = 'PASS';
        let message = `Ops/sec: ${operationsPerSecond.toFixed(1)}, Memory/Op: ${(memoryPerOperation / 1024).toFixed(1)}KB, CPU/Op: ${(cpuPerOperation / 1000).toFixed(1)}ms, Efficiency: ${efficiencyScore}/100`;
        
        if (efficiencyScore < 60) {
            status = 'FAIL';
        } else if (efficiencyScore < 80) {
            status = 'WARN';
        }
        
        logTest(status, 'Resource Utilization', message);
        if (status === 'PASS') this.passed++;
        else if (status === 'WARN') this.warnings++;
        else this.failed++;
    }
    
    calculateEfficiencyScore(metrics) {
        let score = 100;
        
        // Penalize slow operations
        if (metrics.operationsPerSecond < 5) score -= 20;
        else if (metrics.operationsPerSecond < 10) score -= 10;
        
        // Penalize high memory usage
        if (metrics.memoryPerOperation > 1024 * 1024) score -= 20; // 1MB per operation
        else if (metrics.memoryPerOperation > 512 * 1024) score -= 10; // 512KB per operation
        
        // Penalize high CPU usage
        if (metrics.cpuPerOperation > 100) score -= 20; // 100ms per operation
        else if (metrics.cpuPerOperation > 50) score -= 10; // 50ms per operation
        
        // Penalize slow total time
        if (metrics.operationTime > 2000) score -= 15;
        else if (metrics.operationTime > 1000) score -= 5;
        
        return Math.max(0, Math.min(100, score));
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 API TESTING REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n✅ PASSED: ${this.passed} tests`);
        console.log(`❌ FAILED: ${this.failed} tests`);
        console.log(`⚠️  WARNINGS: ${this.warnings} tests`);
        console.log(`📈 SUCCESS RATE: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.failedTests.forEach(test => {
                console.log(`   - ${test.endpoint}: ${test.message}`);
            });
        }
        
        if (this.warnings > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warningTests.forEach(test => {
                console.log(`   - ${test.endpoint}: ${test.message}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
    }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().catch(console.error);