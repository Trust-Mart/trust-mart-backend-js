#!/usr/bin/env node

/**
 * TrustMart AI System Test Script
 * Quick test script to verify AI functionality
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3033/api/v1';
let JWT_TOKEN = '';

// Test configuration
const TEST_USER = {
  username: 'aitestuser',
  email: 'aitest@example.com',
  password: 'password123'
};

const TEST_SOCIAL_ACCOUNTS = {
  instagram: {
    platform: 'instagram',
    accountData: {
      username: 'aitestuser_ig',
      id: 'ig_123456789'
    }
  },
  facebook: {
    platform: 'facebook',
    accountData: {
      name: 'AI Test User',
      id: 'fb_123456789'
    }
  },
  whatsapp: {
    platform: 'whatsapp',
    accountData: {
      phone_number: '+2348123456789',
      display_name: 'AI Test User'
    }
  }
};

// Utility functions
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

const logTest = (testName, result) => {
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${testName}`);
  if (!result.success) {
    console.log(`   Error: ${result.error}`);
    console.log(`   Status: ${result.status}`);
  }
  return result.success;
};

// Test functions
const testServerHealth = async () => {
  console.log('\n🏥 Testing Server Health...');
  
  const healthResult = await makeRequest('GET', '/health');
  logTest('Server Health Check', healthResult);
  
  return healthResult.success;
};

const testUserRegistration = async () => {
  console.log('\n👤 Testing User Registration...');
  
  const registerResult = await makeRequest('POST', '/auth/register', TEST_USER);
  logTest('User Registration', registerResult);
  
  if (registerResult.success) {
    console.log('   User registered successfully');
  }
  
  return registerResult.success;
};

const testUserLogin = async () => {
  console.log('\n🔐 Testing User Login...');
  
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  logTest('User Login', loginResult);
  
  if (loginResult.success && loginResult.data.token) {
    JWT_TOKEN = loginResult.data.token;
    console.log('   JWT token obtained');
  }
  
  return loginResult.success;
};

const testSocialAccountLinking = async () => {
  console.log('\n🔗 Testing Social Account Linking...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  let allSuccess = true;

  // Test Instagram linking
  const instagramResult = await makeRequest(
    'POST', 
    '/ai/social/link', 
    TEST_SOCIAL_ACCOUNTS.instagram,
    headers
  );
  allSuccess &= logTest('Instagram Account Linking', instagramResult);

  // Test Facebook linking
  const facebookResult = await makeRequest(
    'POST', 
    '/ai/social/link', 
    TEST_SOCIAL_ACCOUNTS.facebook,
    headers
  );
  allSuccess &= logTest('Facebook Account Linking', facebookResult);

  // Test WhatsApp linking
  const whatsappResult = await makeRequest(
    'POST', 
    '/ai/social/link', 
    TEST_SOCIAL_ACCOUNTS.whatsapp,
    headers
  );
  allSuccess &= logTest('WhatsApp Account Linking', whatsappResult);

  return allSuccess;
};

const testGetLinkedAccounts = async () => {
  console.log('\n📱 Testing Get Linked Accounts...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('GET', '/ai/social/accounts', null, headers);
  
  logTest('Get Linked Accounts', result);
  
  if (result.success) {
    console.log(`   Found ${result.data.accounts?.length || 0} linked accounts`);
  }
  
  return result.success;
};

const testLegitimacyMonitoring = async () => {
  console.log('\n👁️ Testing Legitimacy Monitoring...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('POST', '/ai/legitimacy/monitor', null, headers);
  
  logTest('Legitimacy Monitoring', result);
  
  if (result.success) {
    console.log(`   Overall Score: ${result.data.overallScore}`);
    console.log(`   Risk Level: ${result.data.results?.[0]?.riskLevel || 'unknown'}`);
  }
  
  return result.success;
};

const testBehaviorMonitoring = async () => {
  console.log('\n🔍 Testing Behavior Monitoring...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('POST', '/ai/behavior/monitor', null, headers);
  
  logTest('Behavior Monitoring', result);
  
  if (result.success) {
    console.log(`   Behavior Score: ${result.data.behaviorScore}`);
    console.log(`   Risk Level: ${result.data.riskLevel}`);
  }
  
  return result.success;
};

const testSellerScoreCalculation = async () => {
  console.log('\n📊 Testing Seller Score Calculation...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('POST', '/ai/seller/score', null, headers);
  
  logTest('Seller Score Calculation', result);
  
  if (result.success) {
    console.log(`   Overall Score: ${result.data.overallScore}`);
    console.log(`   Tier: ${result.data.scoreTier?.label || 'unknown'}`);
    console.log(`   Badge: ${result.data.scoreTier?.badge || 'unknown'}`);
  }
  
  return result.success;
};

const testGetSellerScore = async () => {
  console.log('\n📈 Testing Get Seller Score...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('GET', '/ai/seller/score', null, headers);
  
  logTest('Get Seller Score', result);
  
  if (result.success) {
    console.log(`   Score: ${result.data.score}`);
    console.log(`   Tier: ${result.data.tier?.label || 'unknown'}`);
  }
  
  return result.success;
};

const testTopSellers = async () => {
  console.log('\n🏆 Testing Get Top Sellers...');
  
  const result = await makeRequest('GET', '/ai/seller/top?limit=5');
  
  logTest('Get Top Sellers', result);
  
  if (result.success) {
    console.log(`   Found ${result.data.sellers?.length || 0} top sellers`);
  }
  
  return result.success;
};

const testAIInsights = async () => {
  console.log('\n📊 Testing AI Insights...');
  
  if (!JWT_TOKEN) {
    console.log('❌ No JWT token available');
    return false;
  }

  const headers = { Authorization: `Bearer ${JWT_TOKEN}` };
  const result = await makeRequest('GET', '/ai/insights', null, headers);
  
  logTest('AI Insights', result);
  
  if (result.success) {
    console.log('   AI insights retrieved successfully');
  }
  
  return result.success;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting TrustMart AI System Tests...\n');
  
  const tests = [
    testServerHealth,
    testUserRegistration,
    testUserLogin,
    testSocialAccountLinking,
    testGetLinkedAccounts,
    testLegitimacyMonitoring,
    testBehaviorMonitoring,
    testSellerScoreCalculation,
    testGetSellerScore,
    testTopSellers,
    testAIInsights
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const success = await test();
      if (success) passedTests++;
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
    }
  }

  console.log('\n📋 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! AI system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }

  return passedTests === totalTests;
};

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, makeRequest, logTest };
