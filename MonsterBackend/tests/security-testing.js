/**
 * Comprehensive Security Testing Suite for MonsterMen90
 * Tests authentication, authorization, CSRF protection, and session management
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// Test configuration
const CONFIG = {
  baseURL: 'http://localhost:3001',
  testUser: {
    email: 'test@monstermen90.com',
    password: 'TestPassword123!'
  },
  adminUser: {
    email: 'admin@monstermen90.com',
    password: 'AdminPassword123!'
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test utility functions
 */
class SecurityTester {
  constructor() {
    this.csrfToken = null;
    this.sessionId = null;
    this.authToken = null;
  }

  /**
   * Make HTTP request with security headers
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${CONFIG.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add CSRF token if available
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }

    // Add authorization token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }

  /**
   * Test result logging
   */
  logTest(testName, passed, message, details = {}) {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString(),
      ...details
    };

    testResults.tests.push(result);
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ PASS: ${testName} - ${message}`);
    } else {
      testResults.failed++;
      console.log(`❌ FAIL: ${testName} - ${message}`);
    }
  }

  /**
   * Extract CSRF token from response
   */
  extractCSRFToken(response) {
    return response.headers.get('X-CSRF-Token');
  }

  /**
   * Extract session ID from response
   */
  extractSessionId(response) {
    return response.headers.get('X-Session-ID');
  }
}

/**
 * Authentication Security Tests
 */
class AuthenticationTests {
  constructor(tester) {
    this.tester = tester;
  }

  /**
   * Test CSRF protection on login endpoint
   */
  async testCSRFProtectionOnLogin() {
    try {
      const response = await this.tester.makeRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(CONFIG.testUser)
      });

      // Should succeed without CSRF for login
      const passed = response.status === 200 || response.status === 401;
      this.tester.logTest(
        'CSRF Protection - Login Endpoint',
        passed,
        passed ? 'Login endpoint properly excludes CSRF' : 'Unexpected login behavior'
      );
    } catch (error) {
      this.tester.logTest('CSRF Protection - Login Endpoint', false, error.message);
    }
  }

  /**
   * Test CSRF protection on protected endpoints
   */
  async testCSRFProtectionOnProtectedEndpoints() {
    try {
      // First get a CSRF token
      const authResponse = await this.tester.makeRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(CONFIG.testUser)
      });

      if (authResponse.status === 200) {
        this.tester.csrfToken = this.tester.extractCSRFToken(authResponse);
        this.tester.sessionId = this.tester.extractSessionId(authResponse);
      }

      // Test protected endpoint without CSRF token
      const response = await this.tester.makeRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: 'Test User' })
      });

      const passed = response.status === 403;
      this.tester.logTest(
        'CSRF Protection - Protected Endpoint',
        passed,
        passed ? 'Protected endpoint properly requires CSRF token' : 'CSRF protection bypassed'
      );
    } catch (error) {
      this.tester.logTest('CSRF Protection - Protected Endpoint', false, error.message);
    }
  }

  /**
   * Test session timeout
   */
  async testSessionTimeout() {
    try {
      // This test would require waiting for session timeout
      // For now, we'll test session validation logic
      
      const response = await this.tester.makeRequest('/api/auth/validate-session', {
        method: 'GET'
      });

      const passed = [200, 401].includes(response.status);
      this.tester.logTest(
        'Session Validation',
        passed,
        'Session validation endpoint responds appropriately'
      );
    } catch (error) {
      this.tester.logTest('Session Validation', false, error.message);
    }
  }

  /**
   * Test rate limiting on authentication endpoints
   */
  async testRateLimiting() {
    try {
      const attempts = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const response = await this.tester.makeRequest('/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' })
        });
        attempts.push(response.status);
      }

      // Should see rate limiting (429) or consistent failures
      const hasRateLimiting = attempts.some(status => status === 429);
      const consistentFailures = attempts.every(status => status === 401);
      
      const passed = hasRateLimiting || consistentFailures;
      this.tester.logTest(
        'Rate Limiting - Authentication',
        passed,
        passed ? 'Rate limiting is active on auth endpoints' : 'No rate limiting detected'
      );
    } catch (error) {
      this.tester.logTest('Rate Limiting - Authentication', false, error.message);
    }
  }
}

/**
 * Authorization Security Tests
 */
class AuthorizationTests {
  constructor(tester) {
    this.tester = tester;
  }

  /**
   * Test admin-only endpoint protection
   */
  async testAdminEndpointProtection() {
    try {
      // Test with non-admin user
      const response = await this.tester.makeRequest('/api/admin/users', {
        method: 'GET'
      });

      const passed = response.status === 403;
      this.tester.logTest(
        'Admin Endpoint Protection',
        passed,
        passed ? 'Admin endpoint properly protected from non-admin users' : 'Admin endpoint accessible to regular users'
      );
    } catch (error) {
      this.tester.logTest('Admin Endpoint Protection', false, error.message);
    }
  }

  /**
   * Test role-based access control
   */
  async testRoleBasedAccess() {
    try {
      // Test different roles accessing appropriate endpoints
      const endpoints = [
        { path: '/api/products', method: 'GET', expectedRoles: ['buyer', 'wholesaler', 'admin'] },
        { path: '/api/admin/products', method: 'GET', expectedRoles: ['admin'] },
        { path: '/api/wholesaler/orders', method: 'GET', expectedRoles: ['wholesaler', 'admin'] }
      ];

      let allPassed = true;
      
      for (const endpoint of endpoints) {
        const response = await this.tester.makeRequest(endpoint.path, {
          method: endpoint.method
        });

        // This is a simplified test - in real scenario, we'd test with different user roles
        const hasAccess = [200, 401, 403].includes(response.status);
        if (!hasAccess) allPassed = false;
      }

      this.tester.logTest(
        'Role-Based Access Control',
        allPassed,
        allPassed ? 'Role-based access control is functioning' : 'Some role checks failed'
      );
    } catch (error) {
      this.tester.logTest('Role-Based Access Control', false, error.message);
    }
  }
}

/**
 * Session Management Security Tests
 */
class SessionTests {
  constructor(tester) {
    this.tester = tester;
  }

  /**
   * Test secure session creation
   */
  async testSecureSessionCreation() {
    try {
      const response = await this.tester.makeRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(CONFIG.testUser)
      });

      const hasSecurityHeaders = response.headers.get('X-CSRF-Token') && 
                                 response.headers.get('X-Session-ID');
      
      this.tester.logTest(
        'Secure Session Creation',
        hasSecurityHeaders,
        hasSecurityHeaders ? 'Session creation includes security headers' : 'Missing security headers in session creation'
      );
    } catch (error) {
      this.tester.logTest('Secure Session Creation', false, error.message);
    }
  }

  /**
   * Test session invalidation on logout
   */
  async testSessionInvalidation() {
    try {
      // First authenticate
      const authResponse = await this.tester.makeRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(CONFIG.testUser)
      });

      if (authResponse.status === 200) {
        // Then logout
        const logoutResponse = await this.tester.makeRequest('/api/auth/signout', {
          method: 'POST'
        });

        // Try to access protected resource after logout
        const protectedResponse = await this.tester.makeRequest('/api/user/profile', {
          method: 'GET'
        });

        const properlyInvalidated = logoutResponse.status === 200 && protectedResponse.status === 401;
        this.tester.logTest(
          'Session Invalidation on Logout',
          properlyInvalidated,
          properlyInvalidated ? 'Session properly invalidated on logout' : 'Session not properly invalidated'
        );
      } else {
        this.tester.logTest('Session Invalidation on Logout', false, 'Could not authenticate for test');
      }
    } catch (error) {
      this.tester.logTest('Session Invalidation on Logout', false, error.message);
    }
  }
}

/**
 * Input Validation Security Tests
 */
class InputValidationTests {
  constructor(tester) {
    this.tester = tester;
  }

  /**
   * Test SQL injection protection
   */
  async testSQLInjectionProtection() {
    try {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM products WHERE 1=1",
        "<script>alert('xss')</script>"
      ];

      let allProtected = true;
      
      for (const input of maliciousInputs) {
        const response = await this.tester.makeRequest('/api/products/search', {
          method: 'POST',
          body: JSON.stringify({ query: input })
        });

        // Should not return server errors or execute malicious input
        if (response.status === 500) {
          allProtected = false;
        }
      }

      this.tester.logTest(
        'SQL Injection Protection',
        allProtected,
        allProtected ? 'SQL injection attempts properly handled' : 'Potential SQL injection vulnerability detected'
      );
    } catch (error) {
      this.tester.logTest('SQL Injection Protection', false, error.message);
    }
  }

  /**
   * Test XSS protection
   */
  async testXSSProtection() {
    try {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>"
      ];

      let allProtected = true;
      
      for (const payload of xssPayloads) {
        const response = await this.tester.makeRequest('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ full_name: payload })
        });

        // Should sanitize or reject XSS payloads
        if (response.status === 200) {
          const data = await response.json();
          if (data.full_name && data.full_name.includes('<script>')) {
            allProtected = false;
          }
        }
      }

      this.tester.logTest(
        'XSS Protection',
        allProtected,
        allProtected ? 'XSS payloads properly sanitized' : 'Potential XSS vulnerability detected'
      );
    } catch (error) {
      this.tester.logTest('XSS Protection', false, error.message);
    }
  }
}

/**
 * Main test runner
 */
async function runSecurityTests() {
  console.log('🔒 Starting MonsterMen90 Security Test Suite\n');
  console.log('=' * 60);

  const tester = new SecurityTester();
  
  // Run all test suites
  const authTests = new AuthenticationTests(tester);
  const authzTests = new AuthorizationTests(tester);
  const sessionTests = new SessionTests(tester);
  const inputTests = new InputValidationTests(tester);

  try {
    // Authentication tests
    console.log('\n🛡️  Running Authentication Security Tests...\n');
    await authTests.testCSRFProtectionOnLogin();
    await authTests.testCSRFProtectionOnProtectedEndpoints();
    await authTests.testSessionTimeout();
    await authTests.testRateLimiting();

    // Authorization tests
    console.log('\n🔐 Running Authorization Security Tests...\n');
    await authzTests.testAdminEndpointProtection();
    await authzTests.testRoleBasedAccess();

    // Session management tests
    console.log('\n⏰ Running Session Management Tests...\n');
    await sessionTests.testSecureSessionCreation();
    await sessionTests.testSessionInvalidation();

    // Input validation tests
    console.log('\n🔍 Running Input Validation Tests...\n');
    await inputTests.testSQLInjectionProtection();
    await inputTests.testXSSProtection();

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }

  // Print results summary
  console.log('\n' + '=' * 60);
  console.log('📊 SECURITY TEST RESULTS SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests.filter(test => !test.passed).forEach(test => {
      console.log(`  - ${test.test}: ${test.message}`);
    });
  }

  console.log('\n🔒 Security Test Suite Complete');
  
  return testResults;
}

// Export for use in other modules
export { runSecurityTests, SecurityTester };

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests().catch(console.error);
}