/**
 * Comprehensive Database Integration Test
 * Tests database integration, admin policies, queries, validation, error handling, and security
 * 
 * Date: 2026-01-04
 * Purpose: Comprehensive testing of database integration and admin policies
 */

import { supabase, supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

console.log('🧪 Starting Comprehensive Database Integration Test...');

// Test results storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  issuesFound: [],
  securityIssues: [],
  performanceIssues: [],
  validationIssues: [],
  errorHandlingIssues: [],
  consistencyIssues: []
};

async function runComprehensiveTest() {
  try {
    console.log('\n📋 Test 1: Database Connection Test');
    await testDatabaseConnection();

    console.log('\n📋 Test 2: Admin Policies and RLS Test');
    await testAdminPolicies();

    console.log('\n📋 Test 3: Database Query Performance Test');
    await testQueryPerformance();

    console.log('\n📋 Test 4: Data Validation Test');
    await testDataValidation();

    console.log('\n📋 Test 5: Error Handling Test');
    await testErrorHandling();

    console.log('\n📋 Test 6: Database Security Test');
    await testDatabaseSecurity();

    console.log('\n📋 Test 7: Data Consistency Test');
    await testDataConsistency();

    console.log('\n📋 Test 8: Transaction and Atomicity Test');
    await testTransactions();

    // Generate comprehensive report
    generateTestReport();

  } catch (error) {
    console.error('❌ Test suite failed with exception:', error);
    testResults.issuesFound.push({
      type: 'critical',
      description: 'Test suite crashed',
      error: error.message
    });
    generateTestReport();
  }
}

// Test 1: Database Connection
async function testDatabaseConnection() {
  testResults.totalTests++;
  console.log('🔌 Testing database connections...');

  try {
    // Test regular connection
    const regularConnection = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (regularConnection.error) {
      testResults.failedTests++;
      testResults.issuesFound.push({
        type: 'connection',
        description: 'Regular database connection failed',
        error: regularConnection.error.message
      });
      console.log('❌ Regular connection failed:', regularConnection.error.message);
    } else {
      testResults.passedTests++;
      console.log('✅ Regular database connection successful');
    }

    // Test admin connection
    const adminConnection = await supabaseAdmin
      .from('products')
      .select('count')
      .limit(1);

    if (adminConnection.error) {
      testResults.failedTests++;
      testResults.issuesFound.push({
        type: 'connection',
        description: 'Admin database connection failed',
        error: adminConnection.error.message
      });
      console.log('❌ Admin connection failed:', adminConnection.error.message);
    } else {
      testResults.passedTests++;
      console.log('✅ Admin database connection successful');
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.issuesFound.push({
      type: 'connection',
      description: 'Database connection test crashed',
      error: error.message
    });
    console.log('❌ Database connection test crashed:', error.message);
  }
}

// Test 2: Admin Policies and RLS
async function testAdminPolicies() {
  testResults.totalTests++;
  console.log('🔐 Testing admin policies and RLS...');

  try {
    // Test if RLS is properly blocking unauthorized access
    const unauthorizedAccess = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (unauthorizedAccess.error && unauthorizedAccess.error.message.includes('permission')) {
      testResults.passedTests++;
      console.log('✅ RLS properly blocking unauthorized access to users table');
    } else {
      testResults.failedTests++;
      testResults.securityIssues.push({
        type: 'rls',
        description: 'RLS not properly blocking unauthorized access',
        severity: 'high'
      });
      console.log('❌ RLS not properly blocking unauthorized access');
    }

    // Test admin access with service role
    const adminAccess = await supabaseAdmin
      .from('users')
      .select('id, user_type')
      .limit(1);

    if (adminAccess.error) {
      testResults.failedTests++;
      testResults.securityIssues.push({
        type: 'admin_access',
        description: 'Admin service role cannot access users table',
        severity: 'critical'
      });
      console.log('❌ Admin service role cannot access users table:', adminAccess.error.message);
    } else {
      testResults.passedTests++;
      console.log('✅ Admin service role can access users table');
    }

    // Check for admin users
    const adminUsers = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_type', 'admin');

    if (adminUsers.error) {
      testResults.failedTests++;
      testResults.issuesFound.push({
        type: 'admin_setup',
        description: 'Cannot query admin users',
        error: adminUsers.error.message
      });
      console.log('❌ Cannot query admin users:', adminUsers.error.message);
    } else if (adminUsers.data && adminUsers.data.length === 0) {
      testResults.failedTests++;
      testResults.issuesFound.push({
        type: 'admin_setup',
        description: 'No admin users found in database',
        severity: 'critical'
      });
      console.log('⚠️  No admin users found in database');
    } else {
      testResults.passedTests++;
      console.log(`✅ Found ${adminUsers.data.length} admin users`);
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.issuesFound.push({
      type: 'policy_test',
      description: 'Admin policy test crashed',
      error: error.message
    });
    console.log('❌ Admin policy test crashed:', error.message);
  }
}

// Test 3: Query Performance
async function testQueryPerformance() {
  testResults.totalTests++;
  console.log('⚡ Testing query performance...');

  try {
    const startTime = Date.now();

    // Test complex query performance
    const complexQuery = await supabaseAdmin
      .from('products')
      .select(`
        *, 
        categories(name, slug),
        product_variants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const queryTime = Date.now() - startTime;

    if (complexQuery.error) {
      testResults.failedTests++;
      testResults.performanceIssues.push({
        type: 'query_error',
        description: 'Complex query failed',
        error: complexQuery.error.message
      });
      console.log('❌ Complex query failed:', complexQuery.error.message);
    } else if (queryTime > 2000) { // More than 2 seconds
      testResults.failedTests++;
      testResults.performanceIssues.push({
        type: 'slow_query',
        description: 'Complex query too slow',
        queryTime: queryTime,
        severity: 'medium'
      });
      console.log(`⚠️  Complex query slow: ${queryTime}ms`);
    } else {
      testResults.passedTests++;
      console.log(`✅ Complex query performed well: ${queryTime}ms`);
    }

    // Test pagination performance
    const paginationStart = Date.now();
    const paginationQuery = await supabaseAdmin
      .from('products')
      .select('id, name, created_at')
      .range(0, 9);

    const paginationTime = Date.now() - paginationStart;

    if (paginationQuery.error) {
      testResults.failedTests++;
      testResults.performanceIssues.push({
        type: 'pagination_error',
        description: 'Pagination query failed',
        error: paginationQuery.error.message
      });
      console.log('❌ Pagination query failed:', paginationQuery.error.message);
    } else if (paginationTime > 1000) { // More than 1 second
      testResults.failedTests++;
      testResults.performanceIssues.push({
        type: 'slow_pagination',
        description: 'Pagination query too slow',
        queryTime: paginationTime,
        severity: 'low'
      });
      console.log(`⚠️  Pagination query slow: ${paginationTime}ms`);
    } else {
      testResults.passedTests++;
      console.log(`✅ Pagination query performed well: ${paginationTime}ms`);
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.performanceIssues.push({
      type: 'performance_test',
      description: 'Performance test crashed',
      error: error.message
    });
    console.log('❌ Performance test crashed:', error.message);
  }
}

// Test 4: Data Validation
async function testDataValidation() {
  testResults.totalTests++;
  console.log('📝 Testing data validation...');

  try {
    // Test invalid product creation
    const invalidProduct = {
      name: '', // Empty name
      price: -100, // Negative price
      sku: '' // Empty SKU
    };

    const invalidProductResult = await supabaseAdmin
      .from('products')
      .insert([invalidProduct]);

    if (invalidProductResult.error) {
      testResults.passedTests++;
      console.log('✅ Database properly rejects invalid product data');
    } else {
      testResults.failedTests++;
      testResults.validationIssues.push({
        type: 'invalid_data',
        description: 'Database accepted invalid product data',
        severity: 'high'
      });
      console.log('❌ Database accepted invalid product data');
      
      // Clean up the invalid data if it was created
      if (invalidProductResult.data && invalidProductResult.data.length > 0) {
        await supabaseAdmin.from('products').delete().eq('id', invalidProductResult.data[0].id);
      }
    }

    // Test valid product creation
    const categories = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (categories.data && categories.data.length > 0) {
      const validProduct = {
        name: 'Test Product',
        slug: 'test-product-' + Date.now(),
        description: 'Test product for validation',
        sku: 'TEST-' + Date.now(),
        category_id: categories.data[0].id,
        base_price: 99.99,
        wholesale_price: 79.99,
        cost_price: 50.00,
        is_active: true
      };

      const validProductResult = await supabaseAdmin
        .from('products')
        .insert([validProduct]);

      if (validProductResult.error) {
        testResults.failedTests++;
        testResults.validationIssues.push({
          type: 'valid_data_rejected',
          description: 'Database rejected valid product data',
          error: validProductResult.error.message,
          severity: 'medium'
        });
        console.log('❌ Database rejected valid product data:', validProductResult.error.message);
      } else {
        testResults.passedTests++;
        console.log('✅ Database accepts valid product data');
        
        // Clean up test data
        await supabaseAdmin.from('products').delete().eq('id', validProductResult.data[0].id);
      }
    } else {
      console.log('ℹ️  Skipping valid product test - no active categories found');
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.validationIssues.push({
      type: 'validation_test',
      description: 'Validation test crashed',
      error: error.message
    });
    console.log('❌ Validation test crashed:', error.message);
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  testResults.totalTests++;
  console.log('🛡️ Testing error handling...');

  try {
    // Test error handling for non-existent table
    const nonExistentTable = await supabaseAdmin
      .from('non_existent_table_xyz')
      .select('*');

    if (nonExistentTable.error) {
      testResults.passedTests++;
      console.log('✅ Proper error handling for non-existent table');
    } else {
      testResults.failedTests++;
      testResults.errorHandlingIssues.push({
        type: 'missing_error',
        description: 'No error returned for non-existent table',
        severity: 'medium'
      });
      console.log('❌ No error returned for non-existent table');
    }

    // Test error handling for invalid query
    const invalidQuery = await supabaseAdmin
      .from('products')
      .select('non_existent_column');

    if (invalidQuery.error) {
      testResults.passedTests++;
      console.log('✅ Proper error handling for invalid column');
    } else {
      testResults.failedTests++;
      testResults.errorHandlingIssues.push({
        type: 'missing_error',
        description: 'No error returned for invalid column',
        severity: 'low'
      });
      console.log('❌ No error returned for invalid column');
    }

    // Test error handling for missing required fields
    const missingFields = await supabaseAdmin
      .from('products')
      .insert([{ name: 'Test' }]); // Missing required fields

    if (missingFields.error) {
      testResults.passedTests++;
      console.log('✅ Proper error handling for missing required fields');
    } else {
      testResults.failedTests++;
      testResults.errorHandlingIssues.push({
        type: 'missing_validation',
        description: 'No error for missing required fields',
        severity: 'high'
      });
      console.log('❌ No error for missing required fields');
      
      // Clean up if data was created
      if (missingFields.data && missingFields.data.length > 0) {
        await supabaseAdmin.from('products').delete().eq('id', missingFields.data[0].id);
      }
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.errorHandlingIssues.push({
      type: 'error_handling_test',
      description: 'Error handling test crashed',
      error: error.message
    });
    console.log('❌ Error handling test crashed:', error.message);
  }
}

// Test 6: Database Security
async function testDatabaseSecurity() {
  testResults.totalTests++;
  console.log('🔒 Testing database security...');

  try {
    // Test if service role key is properly secured
    // This is more of a code review check
    console.log('ℹ️  Checking service role key usage...');
    
    // Check if service role is only used in admin routes
    // This would require code analysis, but we can test access patterns
    const sensitiveDataAccess = await supabaseAdmin
      .from('users')
      .select('email, phone, user_type');

    if (sensitiveDataAccess.error) {
      testResults.failedTests++;
      testResults.securityIssues.push({
        type: 'admin_access_blocked',
        description: 'Admin service role cannot access sensitive user data',
        severity: 'critical'
      });
      console.log('❌ Admin service role cannot access sensitive user data');
    } else {
      testResults.passedTests++;
      console.log('✅ Admin service role can access sensitive data (expected)');
    }

    // Test if regular client can access sensitive data
    const regularSensitiveAccess = await supabase
      .from('users')
      .select('email, phone');

    if (regularSensitiveAccess.error) {
      testResults.passedTests++;
      console.log('✅ Regular client properly blocked from sensitive user data');
    } else {
      testResults.failedTests++;
      testResults.securityIssues.push({
        type: 'data_leak',
        description: 'Regular client can access sensitive user data',
        severity: 'critical'
      });
      console.log('❌ Regular client can access sensitive user data - SECURITY ISSUE!');
    }

    // Test SQL injection protection (basic test)
    const injectionTest = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('name', "test'; DROP TABLE products; --");

    if (injectionTest.error) {
      testResults.passedTests++;
      console.log('✅ SQL injection attempt properly handled');
    } else {
      testResults.failedTests++;
      testResults.securityIssues.push({
        type: 'injection_vulnerability',
        description: 'Potential SQL injection vulnerability',
        severity: 'critical'
      });
      console.log('❌ Potential SQL injection vulnerability detected');
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.securityIssues.push({
      type: 'security_test',
      description: 'Security test crashed',
      error: error.message
    });
    console.log('❌ Security test crashed:', error.message);
  }
}

// Test 7: Data Consistency
async function testDataConsistency() {
  testResults.totalTests++;
  console.log('🔄 Testing data consistency...');

  try {
    // Test referential integrity
    const categories = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (categories.data && categories.data.length > 0) {
      const categoryId = categories.data[0].id;
      
      // Create a product with category reference
      const product = {
        name: 'Consistency Test Product',
        slug: 'consistency-test-' + Date.now(),
        description: 'Product for consistency testing',
        sku: 'CONSIST-' + Date.now(),
        category_id: categoryId,
        base_price: 99.99,
        is_active: true
      };

      const productResult = await supabaseAdmin
        .from('products')
        .insert([product]);

      if (productResult.error) {
        testResults.failedTests++;
        testResults.consistencyIssues.push({
          type: 'creation_failed',
          description: 'Failed to create product for consistency test',
          error: productResult.error.message
        });
        console.log('❌ Failed to create product for consistency test');
      } else {
        const createdProduct = productResult.data[0];
        
        // Verify the product was created with correct category reference
        const verifyProduct = await supabaseAdmin
          .from('products')
          .select('*, categories(name)')
          .eq('id', createdProduct.id)
          .single();

        if (verifyProduct.error) {
          testResults.failedTests++;
          testResults.consistencyIssues.push({
            type: 'verification_failed',
            description: 'Failed to verify product creation',
            error: verifyProduct.error.message
          });
          console.log('❌ Failed to verify product creation');
        } else if (verifyProduct.data.categories && verifyProduct.data.categories.name) {
          testResults.passedTests++;
          console.log('✅ Referential integrity maintained for categories');
        } else {
          testResults.failedTests++;
          testResults.consistencyIssues.push({
            type: 'broken_reference',
            description: 'Category reference not maintained',
            severity: 'medium'
          });
          console.log('❌ Category reference not maintained');
        }

        // Test cascade behavior (if any)
        // Note: This would require testing deletion behavior
        
        // Clean up
        await supabaseAdmin.from('products').delete().eq('id', createdProduct.id);
      }
    } else {
      console.log('ℹ️  Skipping consistency test - no active categories found');
    }

    // Test data type consistency
    const products = await supabaseAdmin
      .from('products')
      .select('id, base_price')
      .limit(5);

    if (products.error) {
      testResults.failedTests++;
      testResults.consistencyIssues.push({
        type: 'query_failed',
        description: 'Failed to query products for type consistency test',
        error: products.error.message
      });
      console.log('❌ Failed to query products for type consistency test');
    } else {
      let allPricesValid = true;
      
      for (const product of products.data) {
        if (typeof product.base_price !== 'number' || product.base_price < 0) {
          allPricesValid = false;
          break;
        }
      }

      if (allPricesValid) {
        testResults.passedTests++;
        console.log('✅ Data type consistency maintained for prices');
      } else {
        testResults.failedTests++;
        testResults.consistencyIssues.push({
          type: 'type_inconsistency',
          description: 'Price data type inconsistency found',
          severity: 'medium'
        });
        console.log('❌ Price data type inconsistency found');
      }
    }

  } catch (error) {
    testResults.failedTests++;
    testResults.consistencyIssues.push({
      type: 'consistency_test',
      description: 'Consistency test crashed',
      error: error.message
    });
    console.log('❌ Consistency test crashed:', error.message);
  }
}

// Test 8: Transactions and Atomicity
async function testTransactions() {
  testResults.totalTests++;
  console.log('🔗 Testing transactions and atomicity...');

  try {
    // Note: Supabase JS client doesn't support transactions directly
    // This is a limitation we should document
    
    console.log('ℹ️  Testing atomic operations...');
    
    const categories = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (categories.data && categories.data.length > 0) {
      const categoryId = categories.data[0].id;
      
      // Test creating product and variant together
      const product = {
        name: 'Transaction Test Product',
        slug: 'transaction-test-' + Date.now(),
        description: 'Product for transaction testing',
        sku: 'TRANS-' + Date.now(),
        category_id: categoryId,
        base_price: 99.99,
        is_active: true
      };

      const productResult = await supabaseAdmin
        .from('products')
        .insert([product]);

      if (productResult.error) {
        testResults.failedTests++;
        testResults.consistencyIssues.push({
          type: 'product_creation_failed',
          description: 'Failed to create product in transaction test',
          error: productResult.error.message
        });
        console.log('❌ Failed to create product in transaction test');
      } else {
        const createdProduct = productResult.data[0];
        
        // Create variant
        const variant = {
          product_id: createdProduct.id,
          size: 'M',
          color: 'Black',
          stock_quantity: 10,
          price: 99.99,
          sku: 'TRANS-VAR-' + Date.now()
        };

        const variantResult = await supabaseAdmin
          .from('product_variants')
          .insert([variant]);

        if (variantResult.error) {
          testResults.failedTests++;
          testResults.consistencyIssues.push({
            type: 'variant_creation_failed',
            description: 'Failed to create variant in transaction test',
            error: variantResult.error.message
          });
          console.log('❌ Failed to create variant in transaction test');
          
          // Clean up product if variant creation failed
          await supabaseAdmin.from('products').delete().eq('id', createdProduct.id);
        } else {
          // Verify both were created successfully
          const verifyProduct = await supabaseAdmin
            .from('products')
            .select('*, product_variants(*)')
            .eq('id', createdProduct.id)
            .single();

          if (verifyProduct.error) {
            testResults.failedTests++;
            testResults.consistencyIssues.push({
              type: 'verification_failed',
              description: 'Failed to verify transaction result',
              error: verifyProduct.error.message
            });
            console.log('❌ Failed to verify transaction result');
          } else if (verifyProduct.data.product_variants && verifyProduct.data.product_variants.length > 0) {
            testResults.passedTests++;
            console.log('✅ Related data creation maintains consistency');
          } else {
            testResults.failedTests++;
            testResults.consistencyIssues.push({
              type: 'missing_relationship',
              description: 'Product-variant relationship not maintained',
              severity: 'medium'
            });
            console.log('❌ Product-variant relationship not maintained');
          }

          // Clean up
          await supabaseAdmin.from('product_variants').delete().eq('id', variantResult.data[0].id);
          await supabaseAdmin.from('products').delete().eq('id', createdProduct.id);
        }
      }
    } else {
      console.log('ℹ️  Skipping transaction test - no active categories found');
    }

    // Document transaction limitation
    testResults.issuesFound.push({
      type: 'limitation',
      description: 'Supabase JS client does not support multi-statement transactions',
      recommendation: 'Consider using PostgreSQL functions or edge functions for complex transactions'
    });
    console.log('ℹ️  Note: Supabase JS client has transaction limitations');

  } catch (error) {
    testResults.failedTests++;
    testResults.consistencyIssues.push({
      type: 'transaction_test',
      description: 'Transaction test crashed',
      error: error.message
    });
    console.log('❌ Transaction test crashed:', error.message);
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE DATABASE INTEGRATION TEST REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests}`);
  console.log(`   Failed: ${testResults.failedTests}`);
  console.log(`   Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n🔴 CRITICAL ISSUES FOUND: ${testResults.issuesFound.filter(i => i.severity === 'critical').length}`);
  console.log(`🟡 HIGH SEVERITY ISSUES: ${testResults.issuesFound.filter(i => i.severity === 'high').length}`);
  console.log(`🟠 MEDIUM SEVERITY ISSUES: ${testResults.issuesFound.filter(i => i.severity === 'medium').length}`);
  console.log(`🟢 LOW SEVERITY ISSUES: ${testResults.issuesFound.filter(i => i.severity === 'low' || !i.severity).length}`);
  
  console.log(`\n🔒 SECURITY ISSUES: ${testResults.securityIssues.length}`);
  console.log(`⚡ PERFORMANCE ISSUES: ${testResults.performanceIssues.length}`);
  console.log(`📝 VALIDATION ISSUES: ${testResults.validationIssues.length}`);
  console.log(`🛡️ ERROR HANDLING ISSUES: ${testResults.errorHandlingIssues.length}`);
  console.log(`🔄 CONSISTENCY ISSUES: ${testResults.consistencyIssues.length}`);
  
  if (testResults.issuesFound.length > 0) {
    console.log(`\n📋 DETAILED ISSUES:`);
    testResults.issuesFound.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.type.toUpperCase()}] ${issue.description}`);
      if (issue.error) console.log(`   Error: ${issue.error}`);
      if (issue.severity) console.log(`   Severity: ${issue.severity}`);
      if (issue.recommendation) console.log(`   Recommendation: ${issue.recommendation}`);
    });
  }
  
  if (testResults.securityIssues.length > 0) {
    console.log(`\n🔒 SECURITY ISSUES DETAILS:`);
    testResults.securityIssues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.type.toUpperCase()}] ${issue.description}`);
      if (issue.severity) console.log(`   Severity: ${issue.severity}`);
    });
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('   1. Fix all critical and high severity issues immediately');
  console.log('   2. Review and improve error handling for database operations');
  console.log('   3. Implement proper data validation at both API and database levels');
  console.log('   4. Consider adding database constraints for data integrity');
  console.log('   5. Review RLS policies to ensure proper access control');
  console.log('   6. Consider implementing proper transaction support for complex operations');
  console.log('   7. Add comprehensive logging for database operations');
  
  console.log('\n💾 REPORT SAVED:');
  console.log('   A detailed JSON report has been generated for further analysis.');
  
  // Save report to file
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  fs.writeFileSync('database_integration_test_report.json', JSON.stringify(report, null, 2));
  console.log('   Report file: database_integration_test_report.json');
  
  // Determine overall status
  const passRate = testResults.passedTests / testResults.totalTests;
  if (passRate >= 0.9) {
    console.log('\n🎉 OVERALL STATUS: PASS - Database integration is working well');
  } else if (passRate >= 0.7) {
    console.log('\n⚠️  OVERALL STATUS: WARNING - Database integration needs improvement');
  } else {
    console.log('\n❌ OVERALL STATUS: FAIL - Database integration has critical issues');
  }
}

// Run the comprehensive test
runComprehensiveTest();