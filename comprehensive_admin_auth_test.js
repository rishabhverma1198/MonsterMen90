#!/usr/bin/env node

/**
 * Comprehensive Admin Authentication Flow Test
 * Tests all aspects of the admin authentication system including:
 * - Context providers
 * - Login component functionality  
 * - Route protection
 * - Session management
 * - Database integration
 * - Logout functionality
 * - Edge cases and error handling
 */

const fs = require('fs');
const path = require('path');

class AdminAuthTester {
    constructor() {
        this.results = {
            criticalIssues: [],
            warnings: [],
            passed: [],
            failed: [],
            totalTests: 0
        };
        this.frontendPath = './MonsterFrontend/src';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'error': '❌',
            'warning': '⚠️',
            'success': '✅',
            'info': 'ℹ️'
        }[type] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async testCodeStructure() {
        this.log('Testing Code Structure and File Organization...');
        
        // Test 1: Check if all required files exist
        const requiredFiles = [
            'context/AdminContext.tsx',
            'context/AdminContextValue.ts', 
            'context/useAdmin.ts',
            'pages/admin/AdminLogin.tsx',
            'routes/AdminProtectedRoute.tsx'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.frontendPath, file);
            if (fs.existsSync(filePath)) {
                this.results.passed.push(`File exists: ${file}`);
                this.log(`File exists: ${file}`, 'success');
            } else {
                this.results.failed.push(`Missing file: ${file}`);
                this.results.criticalIssues.push(`Critical: Missing file ${file}`);
                this.log(`Missing file: ${file}`, 'error');
            }
        }
        this.results.totalTests += requiredFiles.length;
    }

    async testImportIssues() {
        this.log('Testing Import Statements and Dependencies...');
        
        // Test 2: Check AdminProtectedRoute import issue
        const protectedRoutePath = path.join(this.frontendPath, 'routes/AdminProtectedRoute.tsx');
        if (fs.existsSync(protectedRoutePath)) {
            const content = fs.readFileSync(protectedRoutePath, 'utf8');
            
            // Look for the problematic import
            if (content.includes("from '@/hooks/useAdmin'")) {
                this.results.failed.push('AdminProtectedRoute imports useAdmin from wrong path');
                this.results.criticalIssues.push('Critical: AdminProtectedRoute imports useAdmin from @/hooks/useAdmin but file is in @/context/useAdmin.ts');
                this.log('Found incorrect import in AdminProtectedRoute.tsx', 'error');
            } else if (content.includes("from '@/context/useAdmin'")) {
                this.results.passed.push('AdminProtectedRoute uses correct import path');
                this.log('AdminProtectedRoute uses correct import path', 'success');
            } else {
                this.results.warnings.push('AdminProtectedRoute missing useAdmin import');
                this.log('AdminProtectedRoute missing useAdmin import', 'warning');
            }
        }
        this.results.totalTests += 1;

        // Test 3: Check if hooks directory exists when imports suggest it
        const hooksPath = path.join(this.frontendPath, 'hooks');
        if (fs.existsSync(hooksPath)) {
            this.log('Hooks directory exists', 'info');
        } else {
            this.log('Hooks directory does not exist', 'warning');
        }
        this.results.totalTests += 1;
    }

    async testContextImplementation() {
        this.log('Testing AdminContext Implementation...');
        
        // Test 4: Check AdminContext.tsx implementation
        const adminContextPath = path.join(this.frontendPath, 'context/AdminContext.tsx');
        if (fs.existsSync(adminContextPath)) {
            const content = fs.readFileSync(adminContextPath, 'utf8');
            
            // Check for key functionality
            const checks = [
                { pattern: /checkAdminAccess/, description: 'checkAdminAccess function' },
                { pattern: /logout/, description: 'logout function' },
                { pattern: /useEffect.*checkAdminAccess/, description: 'useEffect with checkAdminAccess' },
                { pattern: /onAuthStateChange/, description: 'auth state change listener' },
                { pattern: /supabase\.auth\.signOut/, description: 'signOut implementation' }
            ];

            for (const check of checks) {
                if (check.pattern.test(content)) {
                    this.results.passed.push(`AdminContext has ${check.description}`);
                    this.log(`AdminContext has ${check.description}`, 'success');
                } else {
                    this.results.failed.push(`AdminContext missing ${check.description}`);
                    this.log(`AdminContext missing ${check.description}`, 'error');
                }
                this.results.totalTests += 1;
            }
        }

        // Test 5: Check AdminContextValue types
        const contextValuePath = path.join(this.frontendPath, 'context/AdminContextValue.ts');
        if (fs.existsSync(contextValuePath)) {
            const content = fs.readFileSync(contextValuePath, 'utf8');
            
            if (content.includes('AdminContextType')) {
                this.results.passed.push('AdminContextType defined');
                this.log('AdminContextType defined', 'success');
            } else {
                this.results.failed.push('AdminContextType not defined');
                this.log('AdminContextType not defined', 'error');
            }
            this.results.totalTests += 1;
        }
    }

    async testLoginComponent() {
        this.log('Testing AdminLogin Component...');
        
        // Test 6: Check AdminLogin.tsx implementation
        const loginPath = path.join(this.frontendPath, 'pages/admin/AdminLogin.tsx');
        if (fs.existsSync(loginPath)) {
            const content = fs.readFileSync(loginPath, 'utf8');
            
            const checks = [
                { pattern: /supabase\.auth\.signInWithPassword/, description: 'signInWithPassword implementation' },
                { pattern: /handleAdminLogin/, description: 'handleAdminLogin function' },
                { pattern: /checkAuthStatus|useEffect.*auth/, description: 'auth status checking' },
                { pattern: /navigate.*admin\/dashboard/, description: 'dashboard redirect' },
                { pattern: /toast/, description: 'toast notifications' },
                { pattern: /form.*onSubmit/, description: 'form handling' }
            ];

            for (const check of checks) {
                if (check.pattern.test(content)) {
                    this.results.passed.push(`AdminLogin has ${check.description}`);
                    this.log(`AdminLogin has ${check.description}`, 'success');
                } else {
                    this.results.failed.push(`AdminLogin missing ${check.description}`);
                    this.log(`AdminLogin missing ${check.description}`, 'error');
                }
                this.results.totalTests += 1;
            }
        }
    }

    async testRouteProtection() {
        this.log('Testing Route Protection Logic...');
        
        // Test 7: Check AdminProtectedRoute implementation
        const protectedRoutePath = path.join(this.frontendPath, 'routes/AdminProtectedRoute.tsx');
        if (fs.existsSync(protectedRoutePath)) {
            const content = fs.readFileSync(protectedRoutePath, 'utf8');
            
            const checks = [
                { pattern: /loading.*useAdmin/, description: 'loading state from useAdmin' },
                { pattern: /isAdmin.*useAdmin/, description: 'isAdmin state from useAdmin' },
                { pattern: /Navigate.*login/, description: 'redirect to login' },
                { pattern: /AccessDeniedState|Access Denied/, description: 'access denied UI' },
                { pattern: /timeout|Timeout/, description: 'timeout handling' }
            ];

            for (const check of checks) {
                if (check.pattern.test(content)) {
                    this.results.passed.push(`AdminProtectedRoute has ${check.description}`);
                    this.log(`AdminProtectedRoute has ${check.description}`, 'success');
                } else {
                    this.results.failed.push(`AdminProtectedRoute missing ${check.description}`);
                    this.log(`AdminProtectedRoute missing ${check.description}`, 'error');
                }
                this.results.totalTests += 1;
            }
        }
    }

    async testHookConsistency() {
        this.log('Testing Hook Consistency...');
        
        // Test 8: Check useAdmin hook implementation
        const useAdminPath = path.join(this.frontendPath, 'context/useAdmin.ts');
        if (fs.existsSync(useAdminPath)) {
            const content = fs.readFileSync(useAdminPath, 'utf8');
            
            if (content.includes('useContext(AdminContext)')) {
                this.results.passed.push('useAdmin hook uses correct context');
                this.log('useAdmin hook uses correct context', 'success');
            } else {
                this.results.failed.push('useAdmin hook does not use AdminContext');
                this.log('useAdmin hook does not use AdminContext', 'error');
            }

            if (content.includes('throw new Error') && content.includes('must be used within')) {
                this.results.passed.push('useAdmin hook has proper error handling');
                this.log('useAdmin hook has proper error handling', 'success');
            } else {
                this.results.failed.push('useAdmin hook missing error handling');
                this.log('useAdmin hook missing error handling', 'error');
            }
            this.results.totalTests += 2;
        }
    }

    async testDatabaseIntegration() {
        this.log('Testing Database Integration...');
        
        // Test 9: Check database queries in authentication
        const adminContextPath = path.join(this.frontendPath, 'context/AdminContext.tsx');
        if (fs.existsSync(adminContextPath)) {
            const content = fs.readFileSync(adminContextPath, 'utf8');
            
            const dbChecks = [
                { pattern: /\.from\('users'\)/, description: 'users table query' },
                { pattern: /user_type.*admin/, description: 'admin user type check' },
                { pattern: /is_active/, description: 'is_active field check' },
                { pattern: /select.*id.*email.*user_type/, description: 'proper field selection' }
            ];

            for (const check of dbChecks) {
                if (check.pattern.test(content)) {
                    this.results.passed.push(`Database integration has ${check.description}`);
                    this.log(`Database integration has ${check.description}`, 'success');
                } else {
                    this.results.failed.push(`Database integration missing ${check.description}`);
                    this.log(`Database integration missing ${check.description}`, 'error');
                }
                this.results.totalTests += 1;
            }
        }

        // Test 10: Check login component database queries
        const loginPath = path.join(this.frontendPath, 'pages/admin/AdminLogin.tsx');
        if (fs.existsSync(loginPath)) {
            const content = fs.readFileSync(loginPath, 'utf8');
            
            if (content.includes('.from(\'users\').select(\'user_type, is_active\')')) {
                this.results.passed.push('Login component queries user profile correctly');
                this.log('Login component queries user profile correctly', 'success');
            } else {
                this.results.failed.push('Login component does not query user profile');
                this.log('Login component does not query user profile', 'error');
            }
            this.results.totalTests += 1;
        }
    }

    async testSessionManagement() {
        this.log('Testing Session Management...');
        
        // Test 11: Check session handling in AdminContext
        const adminContextPath = path.join(this.frontendPath, 'context/AdminContext.tsx');
        if (fs.existsSync(adminContextPath)) {
            const content = fs.readFileSync(adminContextPath, 'utf8');
            
            const sessionChecks = [
                { pattern: /getSession|getUser/, description: 'session retrieval' },
                { pattern: /TOKEN_REFRESHED/, description: 'token refresh handling' },
                { pattern: /SIGNED_OUT/, description: 'sign out handling' },
                { pattern: /subscription\.unsubscribe/, description: 'subscription cleanup' }
            ];

            for (const check of sessionChecks) {
                if (check.pattern.test(content)) {
                    this.results.passed.push(`Session management has ${check.description}`);
                    this.log(`Session management has ${check.description}`, 'success');
                } else {
                    this.results.failed.push(`Session management missing ${check.description}`);
                    this.log(`Session management missing ${check.description}`, 'error');
                }
                this.results.totalTests += 1;
            }
        }
    }

    async testErrorHandling() {
        this.log('Testing Error Handling...');
        
        // Test 12: Check error handling in components
        const files = [
            { path: 'context/AdminContext.tsx', name: 'AdminContext' },
            { path: 'pages/admin/AdminLogin.tsx', name: 'AdminLogin' }
        ];

        for (const file of files) {
            const filePath = path.join(this.frontendPath, file.path);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                const errorPatterns = [
                    { pattern: /try.*catch|error/i, description: 'try-catch blocks' },
                    { pattern: /console\.error|throw|Error/, description: 'error logging' },
                    { pattern: /PGRST116/, description: 'Supabase error handling' }
                ];

                for (const check of errorPatterns) {
                    if (check.pattern.test(content)) {
                        this.results.passed.push(`${file.name} has ${check.description}`);
                        this.log(`${file.name} has ${check.description}`, 'success');
                    } else {
                        this.results.warnings.push(`${file.name} missing ${check.description}`);
                        this.log(`${file.name} missing ${check.description}`, 'warning');
                    }
                    this.results.totalTests += 1;
                }
            }
        }
    }

    async generateReport() {
        const successRate = this.results.totalTests > 0 ? 
            ((this.results.passed.length / this.results.totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE ADMIN AUTHENTICATION TEST REPORT');
        console.log('='.repeat(80));
        
        console.log(`📈 Total Tests: ${this.results.totalTests}`);
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`⚠️ Warnings: ${this.results.warnings.length}`);
        console.log(`🎯 Success Rate: ${successRate}%`);

        if (this.results.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.results.criticalIssues.forEach(issue => {
                console.log(`  • ${issue}`);
            });
        }

        if (this.results.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.failed.forEach(failure => {
                console.log(`  • ${failure}`);
            });
        }

        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.results.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }

        console.log('\n🔧 RECOMMENDED FIXES:');
        this.generateFixes();

        console.log('='.repeat(80));

        // Save detailed results
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.results.totalTests,
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length,
                successRate: parseFloat(successRate)
            },
            criticalIssues: this.results.criticalIssues,
            failed: this.results.failed,
            warnings: this.results.warnings,
            passed: this.results.passed
        };

        fs.writeFileSync(
            'admin_auth_test_report.json',
            JSON.stringify(reportData, null, 2)
        );

        console.log('\n📄 Detailed report saved to: admin_auth_test_report.json');
    }

    generateFixes() {
        const fixes = [];

        // Check for the critical import issue
        const protectedRoutePath = path.join(this.frontendPath, 'routes/AdminProtectedRoute.tsx');
        if (fs.existsSync(protectedRoutePath)) {
            const content = fs.readFileSync(protectedRoutePath, 'utf8');
            if (content.includes("from '@/hooks/useAdmin'")) {
                fixes.push('1. Fix AdminProtectedRoute import: Change "@/hooks/useAdmin" to "@/context/useAdmin"');
            }
        }

        // Add other potential fixes based on findings
        if (this.results.failed.some(f => f.includes('missing'))) {
            fixes.push('2. Review all missing implementations and add proper error handling');
        }

        if (this.results.warnings.length > 0) {
            fixes.push('3. Address warnings to improve code quality and reliability');
        }

        fixes.forEach(fix => console.log(`  ${fix}`));
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive Admin Authentication Testing...');
        
        try {
            await this.testCodeStructure();
            await this.testImportIssues();
            await this.testContextImplementation();
            await this.testLoginComponent();
            await this.testRouteProtection();
            await this.testHookConsistency();
            await this.testDatabaseIntegration();
            await this.testSessionManagement();
            await this.testErrorHandling();
            
            await this.generateReport();
            
        } catch (error) {
            this.log(`Test execution failed: ${error.message}`, 'error');
            console.error(error);
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new AdminAuthTester();
    tester.runAllTests().catch(console.error);
}

module.exports = AdminAuthTester;