#!/usr/bin/env node

/**
 * Simple Test Server for TrustMart AI System
 * Minimal server for testing AI endpoints without full dependencies
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3033;

// Middleware
app.use(cors());
app.use(express.json());

// Mock JWT verification middleware
const mockAuth = (req, res, next) => {
  // Mock user for testing
  req.user = { id: 1, username: 'testuser', email: 'test@example.com' };
  next();
};

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TrustMart AI System is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock AI endpoints for testing
app.post('/api/v1/ai/social/link', mockAuth, (req, res) => {
  const { platform, accountData } = req.body;
  
  if (!platform || !accountData) {
    return res.status(400).json({
      success: false,
      message: 'Platform and account data are required'
    });
  }

  // Mock verification score based on platform
  const scores = {
    instagram: 0.85,
    facebook: 0.80,
    whatsapp: 0.75
  };

  res.json({
    success: true,
    message: 'Social account linked successfully',
    data: {
      success: true,
      platform,
      verificationScore: scores[platform] || 0.70,
      accountData,
      linkedAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/ai/social/accounts', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Linked accounts retrieved successfully',
    data: {
      accounts: [
        {
          platform: 'instagram',
          verificationScore: 0.85,
          linkedAt: new Date().toISOString()
        },
        {
          platform: 'facebook',
          verificationScore: 0.80,
          linkedAt: new Date().toISOString()
        },
        {
          platform: 'whatsapp',
          verificationScore: 0.75,
          linkedAt: new Date().toISOString()
        }
      ],
      totalAccounts: 3
    }
  });
});

app.post('/api/v1/ai/legitimacy/monitor', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Legitimacy monitoring completed',
    data: {
      overallScore: 0.85,
      riskLevel: 'low',
      results: [
        {
          platform: 'instagram',
          legitimacyScore: 0.90,
          riskLevel: 'low',
          lastChecked: new Date().toISOString()
        },
        {
          platform: 'facebook',
          legitimacyScore: 0.85,
          riskLevel: 'low',
          lastChecked: new Date().toISOString()
        }
      ]
    }
  });
});

app.post('/api/v1/ai/behavior/monitor', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Behavior monitoring completed',
    data: {
      behaviorScore: 0.75,
      riskLevel: 'medium',
      analysis: {
        listing: { score: 0.8, issues: [] },
        communication: { score: 0.7, issues: ['Slow response time'] },
        transaction: { score: 0.8, issues: [] }
      },
      lastChecked: new Date().toISOString()
    }
  });
});

app.post('/api/v1/ai/seller/score', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Seller score calculated successfully',
    data: {
      overallScore: 0.853,
      scoreTier: {
        tier: 'veryGood',
        label: 'Very Good',
        badge: '⭐',
        color: '#3B82F6'
      },
      breakdown: {
        socialVerification: 0.85,
        legitimacyScore: 0.90,
        behaviorScore: 0.75,
        fraudScore: 0.95,
        transactionHistory: 0.80,
        productQuality: 0.88
      },
      calculatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/ai/seller/score', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Seller score retrieved successfully',
    data: {
      overallScore: 0.853,
      scoreTier: {
        tier: 'veryGood',
        label: 'Very Good',
        badge: '⭐',
        color: '#3B82F6'
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

app.get('/api/v1/ai/seller/top', (req, res) => {
  const { limit = 10 } = req.query;
  
  res.json({
    success: true,
    message: 'Top sellers retrieved successfully',
    data: {
      sellers: [
        {
          id: 1,
          username: 'testuser',
          score: 0.853,
          tier: {
            label: 'Very Good',
            badge: '⭐'
          }
        },
        {
          id: 2,
          username: 'seller2',
          score: 0.789,
          tier: {
            label: 'Good',
            badge: '👍'
          }
        }
      ],
      total: 2,
      limit: parseInt(limit)
    }
  });
});

app.get('/api/v1/ai/insights', mockAuth, (req, res) => {
  res.json({
    success: true,
    message: 'AI insights retrieved successfully',
    data: {
      insights: {
        fraud: {
          totalProducts: 10,
          flaggedProducts: 1,
          fraudRate: 0.1
        },
        socialLinking: {
          totalUsers: 5,
          usersWithSocialAccounts: 3,
          linkingRate: 0.6
        },
        sellerScoring: {
          avgScore: 0.75,
          tierDistribution: {
            excellent: 1,
            veryGood: 2,
            good: 1,
            fair: 1
          }
        }
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Mock authentication endpoints
app.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required'
    });
  }

  res.json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: 1,
      username,
      email,
      createdAt: new Date().toISOString()
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Mock JWT token
  const token = 'mock_jwt_token_' + Date.now();
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: 1,
        username: 'testuser',
        email
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TrustMart AI Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔗 AI endpoints: http://localhost:${PORT}/api/v1/ai/*`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth/*`);
  console.log('');
  console.log('✅ Ready for Postman testing!');
});

export default app;
