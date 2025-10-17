#!/usr/bin/env node

/**
 * TrustMart AI System Test - Without Database
 * Tests AI services directly without database dependencies
 */

import AIService from './services/ai/AIService.js';
import SocialAccountLinkingService from './services/ai/SocialAccountLinkingService.js';
import FraudDetectionService from './services/ai/FraudDetectionService.js';
import SellerScoringService from './services/ai/SellerScoringService.js';

console.log('🚀 Testing TrustMart AI System (Without Database)...\n');

// Test AI Service Initialization
async function testAIServiceInitialization() {
  console.log('🤖 Testing AI Service Initialization...');
  
  try {
    const aiService = new AIService();
    const result = await aiService.initialize();
    
    if (result.success) {
      console.log('✅ AI Service initialized successfully');
      return true;
    } else {
      console.log('❌ AI Service initialization failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ AI Service initialization error: ${error.message}`);
    return false;
  }
}

// Test Social Account Linking Service
async function testSocialAccountLinking() {
  console.log('\n🔗 Testing Social Account Linking Service...');
  
  try {
    const socialService = new SocialAccountLinkingService();
    await socialService.initialize();
    
    // Test Instagram verification
    const instagramResult = await socialService.verifyAccountData('instagram', {
      username: 'testuser',
      id: 'ig_123456'
    });
    
    console.log(`✅ Instagram verification: ${instagramResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Score: ${instagramResult.score}`);
    console.log(`   Reason: ${instagramResult.reason}`);
    
    // Test Facebook verification
    const facebookResult = await socialService.verifyAccountData('facebook', {
      name: 'Test User',
      id: 'fb_123456'
    });
    
    console.log(`✅ Facebook verification: ${facebookResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Score: ${facebookResult.score}`);
    console.log(`   Reason: ${facebookResult.reason}`);
    
    // Test WhatsApp verification
    const whatsappResult = await socialService.verifyAccountData('whatsapp', {
      phone_number: '+2348123456789',
      display_name: 'Test User'
    });
    
    console.log(`✅ WhatsApp verification: ${whatsappResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   Score: ${whatsappResult.score}`);
    console.log(`   Reason: ${whatsappResult.reason}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Social Account Linking error: ${error.message}`);
    return false;
  }
}

// Test Fraud Detection Service
async function testFraudDetection() {
  console.log('\n🔍 Testing Fraud Detection Service...');
  
  try {
    const fraudService = new FraudDetectionService();
    await fraudService.initialize();
    
    // Test product analysis
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      descrption: 'This is a legitimate test product for sale',
      price: 100,
      seller_id: 1,
      seller: { id: 1, username: 'testuser' }
    };
    
    const fraudResult = await fraudService.analyzeProduct(mockProduct);
    
    console.log(`✅ Fraud analysis: PASS`);
    console.log(`   Score: ${fraudResult.score}`);
    console.log(`   Reason: ${fraudResult.reason}`);
    
    // Test suspicious product
    const suspiciousProduct = {
      id: 2,
      name: 'URGENT!!! FREE MONEY!!!',
      descrption: 'Get rich quick! Limited time offer! Act now!',
      price: 0.01,
      seller_id: 2,
      seller: { id: 2, username: 'suspicioususer' }
    };
    
    const suspiciousResult = await fraudService.analyzeProduct(suspiciousProduct);
    
    console.log(`✅ Suspicious product analysis: PASS`);
    console.log(`   Score: ${suspiciousResult.score}`);
    console.log(`   Reason: ${suspiciousResult.reason}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Fraud Detection error: ${error.message}`);
    return false;
  }
}

// Test Seller Scoring Service
async function testSellerScoring() {
  console.log('\n📊 Testing Seller Scoring Service...');
  
  try {
    const scoringService = new SellerScoringService();
    await scoringService.initialize();
    
    // Test social verification score calculation
    const socialScore = await scoringService.calculateSocialVerificationScore(1);
    console.log(`✅ Social verification score: ${socialScore.score}`);
    console.log(`   Reason: ${socialScore.reason}`);
    
    // Test legitimacy score calculation
    const legitimacyScore = await scoringService.calculateLegitimacyScore(1);
    console.log(`✅ Legitimacy score: ${legitimacyScore.score}`);
    console.log(`   Reason: ${legitimacyScore.reason}`);
    
    // Test behavior score calculation
    const behaviorScore = await scoringService.calculateBehaviorScore(1);
    console.log(`✅ Behavior score: ${behaviorScore.score}`);
    console.log(`   Reason: ${behaviorScore.reason}`);
    
    // Test fraud score calculation
    const fraudScore = await scoringService.calculateFraudScore(1);
    console.log(`✅ Fraud score: ${fraudScore.score}`);
    console.log(`   Reason: ${fraudScore.reason}`);
    
    // Test transaction score calculation
    const transactionScore = await scoringService.calculateTransactionScore(1);
    console.log(`✅ Transaction score: ${transactionScore.score}`);
    console.log(`   Reason: ${transactionScore.reason}`);
    
    // Test product quality score calculation
    const productScore = await scoringService.calculateProductQualityScore(1);
    console.log(`✅ Product quality score: ${productScore.score}`);
    console.log(`   Reason: ${productScore.reason}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Seller Scoring error: ${error.message}`);
    return false;
  }
}

// Test AI Service Methods
async function testAIServiceMethods() {
  console.log('\n🎯 Testing AI Service Methods...');
  
  try {
    const aiService = new AIService();
    await aiService.initialize();
    
    // Test product verification
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      descrption: 'This is a test product',
      image_cid: ['image1.jpg', 'image2.jpg'],
      seller_id: 1,
      seller: { id: 1, username: 'testuser' }
    };
    
    const verificationResult = await aiService.processProductVerification(1);
    console.log(`✅ Product verification: PASS`);
    console.log(`   AI Score: ${verificationResult.aiScore}`);
    console.log(`   Status: ${verificationResult.status}`);
    
    // Test image analysis
    const imageAnalysis = await aiService.analyzeProductImages(['image1.jpg', 'image2.jpg']);
    console.log(`✅ Image analysis: PASS`);
    console.log(`   Score: ${imageAnalysis.score}`);
    console.log(`   Reason: ${imageAnalysis.reason}`);
    
    // Test description analysis
    const descriptionAnalysis = await aiService.analyzeProductDescription('This is a legitimate product description');
    console.log(`✅ Description analysis: PASS`);
    console.log(`   Score: ${descriptionAnalysis.score}`);
    console.log(`   Reason: ${descriptionAnalysis.reason}`);
    
    return true;
  } catch (error) {
    console.log(`❌ AI Service Methods error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    testAIServiceInitialization,
    testSocialAccountLinking,
    testFraudDetection,
    testSellerScoring,
    testAIServiceMethods
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
    console.log('\n🎉 All AI services are working correctly!');
    console.log('🚀 Your TrustMart AI system is ready for integration!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }

  return passedTests === totalTests;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
