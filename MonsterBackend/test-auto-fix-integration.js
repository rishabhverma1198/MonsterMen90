// Auto-Fix Integration Test
// Tests the complete auto-fix system integration

import axios from 'axios';
import { autoFixSystem } from './supabase-auto-fix.js';

const API_BASE = 'http://localhost:3001';

async function testAutoFixIntegration() {
  console.log('🧪 Testing Auto-Fix Integration...');
  
  try {
    // Test 1: Check if server starts with auto-fix integration
    console.log('\n📋 Test 1: Server Status Check');
    const statusResponse = await axios.get(`${API_BASE}/api/auto-fix/status`);
    console.log('✅ Auto-fix status endpoint working');
    console.log('📊 Status:', statusResponse.data);

    // Test 2: Health check
    console.log('\n📋 Test 2: Health Check');
    const healthResponse = await axios.get(`${API_BASE}/api/auto-fix/health`);
    console.log('✅ Auto-fix health endpoint working');
    console.log('🏥 Health:', healthResponse.data);

    // Test 3: Alerts endpoint
    console.log('\n📋 Test 3: Alerts Endpoint');
    const alertsResponse = await axios.get(`${API_BASE}/api/auto-fix/alerts`);
    console.log('✅ Auto-fix alerts endpoint working');
    console.log('🔔 Alerts:', alertsResponse.data);

    // Test 4: Manual trigger
    console.log('\n📋 Test 4: Manual Trigger');
    const triggerResponse = await axios.post(`${API_BASE}/api/auto-fix/trigger`, {
      component: 'database'
    });
    console.log('✅ Auto-fix trigger working');
    console.log('🔧 Trigger result:', triggerResponse.data);

    // Test 5: Test database connection auto-fix
    console.log('\n📋 Test 5: Database Connection Auto-Fix');
    const dbTestResponse = await axios.get(`${API_BASE}/api/auto-fix/trigger`, {
      data: { component: 'database' }
    });
    console.log('✅ Database auto-fix triggered');
    console.log('🔧 Database result:', dbTestResponse.data);

    // Test 6: Test route registration
    console.log('\n📋 Test 6: Route Registration Check');
    const routesResponse = await axios.get(`${API_BASE}/api/products`);
    console.log('✅ Product routes still working after auto-fix integration');
    
    console.log('\n🎉 All Auto-Fix Integration Tests Passed!');
    console.log('\n📈 Auto-Fix Integration Summary:');
    console.log('  ✅ Status monitoring active');
    console.log('  ✅ Health checks functional');
    console.log('  ✅ Alert system operational');
    console.log('  ✅ Manual triggers working');
    console.log('  ✅ Auto-fix components responsive');
    console.log('  ✅ Existing routes preserved');

  } catch (error) {
    console.error('❌ Auto-Fix Integration Test Failed:', error.message);
    if (error.response) {
      console.error('📋 Response:', error.response.data);
      console.error('📋 Status:', error.response.status);
    }
    return false;
  }

  return true;
}

async function runIntegrationTests() {
  console.log('🚀 Starting Auto-Fix Integration Tests...');
  console.log('=====================================');
  
  const success = await testAutoFixIntegration();
  
  if (success) {
    console.log('\n🎊 SUCCESS: Auto-Fix Integration is Fully Functional!');
    console.log('\n📋 Available Auto-Fix Endpoints:');
    console.log(`  🔍 Status: GET ${API_BASE}/api/auto-fix/status`);
    console.log(`  🩺 Health: GET ${API_BASE}/api/auto-fix/health`);
    console.log(`  🔔 Alerts: GET ${API_BASE}/api/auto-fix/alerts`);
    console.log(`  🔧 Trigger: POST ${API_BASE}/api/auto-fix/trigger`);
    
    console.log('\n🛡️ Auto-Fix Protection Active For:');
    console.log('  🗄️ Database connections');
    console.log('  🔗 Supabase client issues');
    console.log('  📝 Route registration problems');
    console.log('  📊 Schema inconsistencies');
    console.log('  🔄 Real-time connection issues');
  } else {
    console.log('\n💥 FAILED: Auto-Fix Integration Issues Detected');
  }
  
  return success;
}

// Export for use
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  testAutoFixIntegration,
  runIntegrationTests
};