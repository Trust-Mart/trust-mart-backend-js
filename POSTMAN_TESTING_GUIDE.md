# 🚀 TrustMart AI System - Postman Testing Guide

## **Step 1: Import Postman Collection**

1. **Open Postman**
2. **Click "Import"** button
3. **Select the file**: `TrustMart_AI_Postman_Collection.json`
4. **Click "Import"**

## **Step 2: Set Up Environment Variables**

The collection uses these variables:
- `base_url`: `http://localhost:3033/api/v1`
- `jwt_token`: (automatically set after login)

## **Step 3: Start Your Server**

```bash
# Make sure your server is running
npm start
```

You should see:
```
Trustmart API running in development mode
Listening on http://localhost:3033
```

## **Step 4: Test Sequence (Follow This Order)**

### **🔐 Step 1: Authentication**

#### **1.1 Register User**
- **Request**: `POST /auth/register`
- **Body**:
```json
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "password123"
}
```
- **Expected Response**: `200 OK` with user data

#### **1.2 Login User**
- **Request**: `POST /auth/login`
- **Body**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Expected Response**: `200 OK` with JWT token
- **Note**: Token is automatically saved to `{{jwt_token}}` variable

### **🔗 Step 2: Social Account Linking**

#### **2.1 Link Instagram Account**
- **Request**: `POST /ai/social/link`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Body**:
```json
{
  "platform": "instagram",
  "accountData": {
    "username": "testuser_ig",
    "id": "ig_123456789"
  }
}
```
- **Expected Response**: 
```json
{
  "success": true,
  "message": "Social account linked successfully",
  "data": {
    "success": true,
    "platform": "instagram",
    "verificationScore": 0.75
  }
}
```

#### **2.2 Link Facebook Account**
- **Request**: `POST /ai/social/link`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Body**:
```json
{
  "platform": "facebook",
  "accountData": {
    "name": "Test User",
    "id": "fb_123456789"
  }
}
```

#### **2.3 Link WhatsApp Account**
- **Request**: `POST /ai/social/link`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Body**:
```json
{
  "platform": "whatsapp",
  "accountData": {
    "phone_number": "+2348123456789",
    "display_name": "Test User"
  }
}
```

#### **2.4 Get Linked Accounts**
- **Request**: `GET /ai/social/accounts`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "platform": "instagram",
        "verificationScore": 0.75
      },
      {
        "platform": "facebook", 
        "verificationScore": 0.80
      }
    ],
    "totalAccounts": 3
  }
}
```

### **👁️ Step 3: AI Monitoring**

#### **3.1 Monitor Legitimacy**
- **Request**: `POST /ai/legitimacy/monitor`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "overallScore": 0.85,
    "results": [
      {
        "platform": "instagram",
        "legitimacyScore": 0.90,
        "riskLevel": "low"
      }
    ]
  }
}
```

#### **3.2 Monitor Behavior**
- **Request**: `POST /ai/behavior/monitor`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "behaviorScore": 0.75,
    "riskLevel": "medium",
    "analysis": {
      "listing": { "score": 0.8 },
      "communication": { "score": 0.7 }
    }
  }
}
```

### **📊 Step 4: Seller Scoring**

#### **4.1 Calculate Seller Score**
- **Request**: `POST /ai/seller/score`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "overallScore": 0.853,
    "scoreTier": {
      "tier": "veryGood",
      "label": "Very Good",
      "badge": "⭐",
      "color": "#3B82F6"
    },
    "breakdown": {
      "socialVerification": 0.85,
      "legitimacyScore": 0.90,
      "behaviorScore": 0.75,
      "fraudScore": 0.95
    }
  }
}
```

#### **4.2 Get Seller Score**
- **Request**: `GET /ai/seller/score`
- **Headers**: `Authorization: Bearer {{jwt_token}}`

#### **4.3 Get Top Sellers**
- **Request**: `GET /ai/seller/top?limit=10`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "sellers": [
      {
        "id": 1,
        "username": "testuser",
        "score": 0.853,
        "tier": {
          "label": "Very Good",
          "badge": "⭐"
        }
      }
    ]
  }
}
```

### **🛍️ Step 5: Product Testing**

#### **5.1 Create Product**
- **Request**: `POST /products`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Body**:
```json
{
  "name": "Test Product",
  "description": "This is a test product for AI verification",
  "price": 100,
  "quantity": 5,
  "currency": "USD"
}
```

#### **5.2 Verify Product with AI**
- **Request**: `POST /ai/product/verify`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Body**:
```json
{
  "productId": 1
}
```
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "aiScore": 0.85,
    "status": "approved",
    "breakdown": {
      "fraudScore": 0.9,
      "sellerTrustScore": 0.8,
      "imageAnalysis": 0.85
    }
  }
}
```

### **📊 Step 6: System Insights**

#### **6.1 Get AI Insights**
- **Request**: `GET /ai/insights`
- **Headers**: `Authorization: Bearer {{jwt_token}}`
- **Expected Response**:
```json
{
  "success": true,
  "data": {
    "insights": {
      "fraud": { "totalProducts": 10, "flaggedProducts": 1 },
      "socialLinking": { "totalUsers": 5, "usersWithSocialAccounts": 3 },
      "sellerScoring": { "avgScore": 0.75, "tierDistribution": {} }
    }
  }
}
```

#### **6.2 Health Check**
- **Request**: `GET /health`
- **Expected Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## **🎯 Testing Checklist**

### **Authentication Tests**
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] JWT token is automatically saved

### **Social Account Linking Tests**
- [ ] Instagram account linking
- [ ] Facebook account linking  
- [ ] WhatsApp account linking
- [ ] Get linked accounts returns all platforms
- [ ] Verification scores are calculated

### **AI Monitoring Tests**
- [ ] Legitimacy monitoring returns scores
- [ ] Behavior monitoring detects patterns
- [ ] Risk levels are properly categorized

### **Seller Scoring Tests**
- [ ] Seller score calculation works
- [ ] Score tiers are correctly assigned
- [ ] Score breakdown shows components
- [ ] Top sellers endpoint works

### **Product Tests**
- [ ] Product creation works
- [ ] AI product verification processes
- [ ] AI scores are calculated correctly

### **System Tests**
- [ ] Health check returns OK
- [ ] AI insights provide statistics
- [ ] Batch processing works

## **🚨 Common Issues & Solutions**

### **Issue 1: 401 Unauthorized**
- **Cause**: Missing or invalid JWT token
- **Solution**: Run login request first, ensure token is saved

### **Issue 2: 500 Internal Server Error**
- **Cause**: Database not set up or server not running
- **Solution**: 
  ```bash
  npm run migrate
  npm start
  ```

### **Issue 3: Connection Refused**
- **Cause**: Server not running
- **Solution**: Start server with `npm start`

### **Issue 4: Empty Response**
- **Cause**: Database not initialized
- **Solution**: Run migrations and restart server

## **📊 Expected Results Summary**

When all tests pass, you should see:

✅ **Authentication**: User registered and logged in
✅ **Social Linking**: 3 platforms linked with verification scores
✅ **AI Monitoring**: Legitimacy and behavior scores calculated
✅ **Seller Scoring**: Comprehensive score with tier classification
✅ **Product Verification**: AI analysis with fraud detection
✅ **System Health**: All endpoints responding correctly

## **🎉 Success Criteria**

Your TrustMart AI system is working correctly if:
- All requests return 200 status codes
- JWT authentication works properly
- Social accounts are linked and verified
- AI scores are calculated (0-1 range)
- Seller tiers are properly assigned
- System insights provide meaningful data

---

**Happy Testing! 🚀**
