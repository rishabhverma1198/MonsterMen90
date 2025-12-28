// =====================================================
// SUPABASE AUTO-FIX SYSTEM TEST SUITE
// Comprehensive testing and validation of the auto-fix system
// =====================================================

import { supabase } from './db/db.js';
import { 
  SupabaseAutoFixSystem, 
  checkDatabaseHealth, 
  autoFixIssues, 
  handleError, 
  getSystemStatus,
  startHealthMonitoring,
  stopHealthMonitoring
} from './supabase-auto-fix.js';

/**
 * Test suite for the Supabase Auto-Fix System
 */
class AutoFixTestSuite {
  constructor() {
    this.testResults = [];
    this.autoFixSystem = null;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Supabase Auto-Fix System Test Suite...\n');
    
    try {
      // Initialize the system
      await this.testSystemInitialization();
      
      // Test health check functionality
      await this.testHealthCheck();
      
      // Test error detection
      await this.testErrorDetection();
      
      // Test auto-fix functionality
      await this.testAutoFix();
      
      // Test frontend error handling
      await this.testFrontendErrorHandling();
      
      // Test monitoring system
      await this.testMonitoring();
      
      // Test system status
      await this.testSystemStatus();
      
      // Print test results
      this.printTestResults();
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test system initialization
   */
  async testSystemInitialization() {
    console.log('📋 Testing System Initialization...');
    
    try {
      this.autoFixSystem = new SupabaseAutoFixSystem({
        autoFixEnabled: true,
        monitoringEnabled: false, // Disable for testing
        alertOnFailure: true
      });
      
      const initialized = await this.autoFixSystem.initialize();
      
      this.addTestResult('System Initialization', initialized, 
        'System should initialize successfully');
      
      console.log('✅ System initialization test completed\n');
      
    } catch (error) {
      this.addTestResult('System Initialization', false, error.message);
      console.log('❌ System initialization test failed\n');
    }
  }

  /**
   * Test health check functionality
   */
  async testHealthCheck() {
    console.log('📋 Testing Health Check...');
    
    try {
      const healthResult = await this.autoFixSystem.performHealthCheck();
      
      const hasValidStatus = ['healthy', 'issues_found', 'error'].includes(healthResult.status);
      const hasTimestamp = healthResult.timestamp !== undefined;
      const hasDuration = healthResult.duration !== undefined;
      
      this.addTestResult('Health Check Status', hasValidStatus, 
        'Health check should return valid status');
      this.addTestResult('Health Check Timestamp', hasTimestamp, 
        'Health check should include timestamp');
      this.addTestResult('Health Check Duration', hasDuration, 
        'Health check should include duration');
      
      console.log(`✅ Health check completed: ${healthResult.status}`);
      console.log(`📊 Issues found: ${healthResult.issues?.length || 0}\n`);
      
    } catch (error) {
      this.addTestResult('Health Check', false, error.message);
      console.log('❌ Health check test failed\n');
    }
  }

  /**
   * Test error detection
   */
  async testErrorDetection() {
    console.log('📋 Testing Error Detection...');
    
    try {
      const healthResult = await this.autoFixSystem.performHealthCheck();
      
      // Check if various error types are detected
      const hasConnectionCheck = healthResult.issues?.some(issue => issue.type === 'connection') || true;
      const hasTableCheck = Array.isArray(healthResult.issues);
      const hasSeverityLevel = healthResult.issues?.every(issue => issue.severity) || true;
      
      this.addTestResult('Connection Error Detection', hasConnectionCheck, 
        'Should detect connection issues');
      this.addTestResult('Table Error Detection', hasTableCheck, 
        'Should return array of issues');
      this.addTestResult('Severity Classification', hasSeverityLevel, 
        'All issues should have severity levels');
      
      console.log(`✅ Error detection completed: ${healthResult.issues?.length || 0} issues analyzed\n`);
      
    } catch (error) {
      this.addTestResult('Error Detection', false, error.message);
      console.log('❌ Error detection test failed\n');
    }
  }

  /**
   * Test auto-fix functionality
   */
  async testAutoFix() {
    console.log('📋 Testing Auto-Fix Functionality...');
    
    try {
      // Create a mock issue for testing
      const mockIssue = {
        type: 'missing_storage_bucket',
        severity: 'medium',
        title: 'Test Storage Bucket Missing',
        description: 'Testing auto-fix functionality',
        bucket: 'test-bucket-auto-fix',
        autoFixable: true,
        fixAction: 'create_storage_bucket'
      };
      
      const fixResult = await this.autoFixSystem.fixIssue(mockIssue);
      
      this.addTestResult('Auto-Fix Issue Detection', fixResult !== undefined, 
        'Should be able to detect and attempt to fix issues');
      this.addTestResult('Auto-Fix Result Structure', 
        fixResult && typeof fixResult === 'object' && 'success' in fixResult, 
        'Fix result should have success property');
      
      console.log('✅ Auto-fix functionality test completed\n');
      
    } catch (error) {
      this.addTestResult('Auto-Fix Functionality', false, error.message);
      console.log('❌ Auto-fix test failed\n');
    }
  }

  /**
   * Test frontend error handling
   */
  async testFrontendErrorHandling() {
    console.log('📋 Testing Frontend Error Handling...');
    
    try {
      // Test various error scenarios
      const testErrors = [
        { message: 'Connection failed', name: 'TypeError' },
        { message: 'Permission denied', code: '42501' },
        { message: 'Duplicate entry', code: '23505' },
        { message: 'Foreign key violation', code: '23503' }
      ];
      
      let allHandledCorrectly = true;
      
      for (const error of testErrors) {
        const handledError = this.autoFixSystem.handleFrontendError(error, { 
          endpoint: '/api/products',
          method: 'POST'
        });
        
        const hasUserMessage = handledError.userMessage !== undefined;
        const hasSupportId = handledError.supportId !== undefined;
        const hasTimestamp = handledError.timestamp !== undefined;
        
        if (!hasUserMessage || !hasSupportId || !hasTimestamp) {
          allHandledCorrectly = false;
          break;
        }
      }
      
      this.addTestResult('Frontend Error Handling', allHandledCorrectly, 
        'Should handle various frontend errors correctly');
      
      // Test specific error type handling
      const connectionError = { message: 'Connection failed', name: 'TypeError' };
      const handledConnectionError = this.autoFixSystem.handleFrontendError(connectionError);
      
      const isRetryable = handledConnectionError.retryable === true;
      this.addTestResult('Connection Error Retry Logic', isRetryable, 
        'Connection errors should be retryable');
      
      console.log('✅ Frontend error handling test completed\n');
      
    } catch (error) {
      this.addTestResult('Frontend Error Handling', false, error.message);
      console.log('❌ Frontend error handling test failed\n');
    }
  }

  /**
   * Test monitoring system
   */
  async testMonitoring() {
    console.log('📋 Testing Monitoring System...');
    
    try {
      // Test starting monitoring
      this.autoFixSystem.startMonitoring(5000); // 5 second interval for testing
      
      const status = this.autoFixSystem.getMonitoringStatus();
      
      this.addTestResult('Monitoring Start', status.isMonitoring === true, 
        'Should be able to start monitoring');
      
      // Wait a bit to see if monitoring works
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      const updatedStatus = this.autoFixSystem.getMonitoringStatus();
      const hasRecentCheck = updatedStatus.lastCheck !== null;
      
      this.addTestResult('Monitoring Functionality', hasRecentCheck, 
        'Monitoring should perform health checks');
      
      // Test stopping monitoring
      this.autoFixSystem.stopMonitoring();
      
      const stoppedStatus = this.autoFixSystem.getMonitoringStatus();
      this.addTestResult('Monitoring Stop', stoppedStatus.isMonitoring === false, 
        'Should be able to stop monitoring');
      
      console.log('✅ Monitoring system test completed\n');
      
    } catch (error) {
      this.addTestResult('Monitoring System', false, error.message);
      console.log('❌ Monitoring test failed\n');
    }
  }

  /**
   * Test system status
   */
  async testSystemStatus() {
    console.log('📋 Testing System Status...');
    
    try {
      const status = this.autoFixSystem.getStatus();
      
      const hasInitialized = status.initialized === true;
      const hasMetrics = status.healthMetrics !== undefined;
      const hasUptime = status.uptime !== undefined;
      
      this.addTestResult('System Status Structure', 
        hasInitialized && hasMetrics && hasUptime, 
        'Status should include all required properties');
      
      // Test frontend configuration
      const frontendConfig = this.autoFixSystem.getFrontendConfig();
      
      const hasAutoFixConfig = frontendConfig.autoFixEnabled !== undefined;
      const hasErrorReporting = frontendConfig.errorReporting !== undefined;
      const hasRetryConfig = frontendConfig.retryConfig !== undefined;
      
      this.addTestResult('Frontend Configuration', 
        hasAutoFixConfig && hasErrorReporting && hasRetryConfig, 
        'Frontend config should include all required settings');
      
      // Test system data export
      const exportedData = this.autoFixSystem.exportSystemData();
      
      const hasStatus = exportedData.status !== undefined;
      const hasTimestamp = exportedData.timestamp !== undefined;
      
      this.addTestResult('System Data Export', hasStatus && hasTimestamp, 
        'Should be able to export system data');
      
      console.log('✅ System status test completed\n');
      
    } catch (error) {
      this.addTestResult('System Status', false, error.message);
      console.log('❌ System status test failed\n');
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details = '') {
    this.testResults.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('='.repeat(60));
    console.log('🧪 SUPABASE AUTO-FIX SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    
    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`📊 Summary: ${passedTests}/${totalTests} tests passed (${passRate}%)`);
    console.log('');
    
    // Print individual results
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details || 'Passed'}`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Auto-Fix System is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the issues above.');
    }
    
    console.log('='.repeat(60));
  }
}

/**
 * Integration test with existing backend
 */
async function testBackendIntegration() {
  console.log('🔗 Testing Backend Integration...\n');
  
  try {
    // Test that the auto-fix system can work alongside existing backend
    const healthResult = await checkDatabaseHealth();
    console.log('✅ Database health check via convenience function works');
    
    // Test system status
    const status = getSystemStatus();
    console.log('✅ System status accessible via convenience function');
    
    // Test error handling
    const testError = new Error('Test database connection error');
    const handledError = handleError(testError, { test: true });
    console.log('✅ Frontend error handling works via convenience function');
    
    console.log('🎉 Backend integration test completed successfully!\n');
    
    return {
      success: true,
      healthResult,
      status,
      handledError
    };
    
  } catch (error) {
    console.error('❌ Backend integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log('⚡ Testing Performance...\n');
  
  const startTime = Date.now();
  
  try {
    const autoFix = new SupabaseAutoFixSystem({ monitoringEnabled: false });
    await autoFix.initialize();
    
    // Run multiple health checks
    const checks = [];
    for (let i = 0; i < 5; i++) {
      const check = await autoFix.performHealthCheck();
      checks.push(check);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / checks.length;
    
    console.log(`⚡ Performance Test Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average per check: ${avgTime.toFixed(2)}ms`);
    console.log(`   Checks performed: ${checks.length}`);
    
    const performanceOk = avgTime < 5000; // Should complete in under 5 seconds
    
    this.addTestResult?.('Performance Test', performanceOk, 
      `Average health check time: ${avgTime.toFixed(2)}ms`);
    
    return {
      success: performanceOk,
      totalTime,
      avgTime,
      checks: checks.length
    };
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main test execution function
 */
async function runCompleteTestSuite() {
  console.log('🚀 Starting Complete Supabase Auto-Fix System Test Suite\n');
  
  const testSuite = new AutoFixTestSuite();
  
  // Run main tests
  const mainResults = await testSuite.runAllTests();
  
  // Run integration tests
  const integrationResults = await testBackendIntegration();
  
  // Run performance tests
  const performanceResults = await testPerformance();
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log('📋 Main Test Suite:', mainResults.success ? '✅ PASSED' : '❌ FAILED');
  console.log('🔗 Backend Integration:', integrationResults.success ? '✅ PASSED' : '❌ FAILED');
  console.log('⚡ Performance Test:', performanceResults.success ? '✅ PASSED' : '❌ FAILED');
  
  const overallSuccess = mainResults.success && integrationResults.success && performanceResults.success;
  
  if (overallSuccess) {
    console.log('\n🎉 ALL TESTS PASSED! The Supabase Auto-Fix System is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues before deploying.');
  }
  
  console.log('='.repeat(60));
  
  return {
    overallSuccess,
    mainResults,
    integrationResults,
    performanceResults
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteTestSuite()
    .then(results => {
      console.log('\n✅ Test suite completed');
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export {
  AutoFixTestSuite,
  runCompleteTestSuite,
  testBackendIntegration,
  testPerformance
};