# TrustMart AI System Testing Guide

## 🚀 **Quick Start Testing**

### **1. Environment Setup**

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=trustmart_db
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3033
NODE_ENV=development
API_VERSION=1
```

### **2. Install Dependencies & Run Migrations**

```bash
# Install dependencies
npm install

# Run database migrations
npx sequelize-cli db:migrate

# Start the server
npm start
```

### **3. Test Server Health**

```bash
# Test basic server
curl http://localhost:3033/

# Test health endpoint
curl http://localhost:3033/api/v1/health
```

## 🧪 **AI System Testing**

### **Test 1: Social Account Linking**

```bash
# First, register a user and get JWT token
curl -X POST http://localhost:3033/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Link Instagram account
curl -X POST http://localhost:3033/api/v1/ai/social/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "instagram",
    "accountData": {
      "username": "testuser_ig",
      "id": "ig_123456"
    }
  }'

# Link Facebook account
curl -X POST http://localhost:3033/api/v1/ai/social/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "facebook",
    "accountData": {
      "name": "Test User",
      "id": "fb_123456"
    }
  }'

# Link WhatsApp account
curl -X POST http://localhost:3033/api/v1/ai/social/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "whatsapp",
    "accountData": {
      "phone_number": "+2348123456789",
      "display_name": "Test User"
    }
  }'
```

### **Test 2: Get Linked Accounts**

```bash
curl -X GET http://localhost:3033/api/v1/ai/social/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 3: Legitimacy Monitoring**

```bash
curl -X POST http://localhost:3033/api/v1/ai/legitimacy/monitor \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 4: Behavior Monitoring**

```bash
curl -X POST http://localhost:3033/api/v1/ai/behavior/monitor \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 5: Seller Score Calculation**

```bash
curl -X POST http://localhost:3033/api/v1/ai/seller/score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 6: Get Seller Score**

```bash
curl -X GET http://localhost:3033/api/v1/ai/seller/score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 7: Product Verification**

```bash
# First create a product
curl -X POST http://localhost:3033/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product for AI verification",
    "price": 100,
    "quantity": 5,
    "currency": "USD"
  }'

# Then verify it with AI
curl -X POST http://localhost:3033/api/v1/ai/product/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": 1
  }'
```

### **Test 8: Get Top Sellers**

```bash
curl -X GET http://localhost:3033/api/v1/ai/seller/top?limit=10
```

### **Test 9: AI Insights (Admin)**

```bash
curl -X GET http://localhost:3033/api/v1/ai/insights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test 10: Batch Processing**

```bash
curl -X POST http://localhost:3033/api/v1/ai/batch/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "limit": 5
  }'
```

## 🎯 **Expected Responses**

### **Successful Social Account Linking**
```json
{
  "success": true,
  "message": "Social account linked successfully",
  "data": {
    "success": true,
    "platform": "instagram",
    "accountId": "instagram_1640995200000",
    "verificationScore": 0.75,
    "message": "instagram account linked successfully"
  }
}
```

### **Seller Score Response**
```json
{
  "success": true,
  "message": "Seller score calculated successfully",
  "data": {
    "success": true,
    "userId": 1,
    "overallScore": 0.85,
    "scoreTier": {
      "tier": "veryGood",
      "label": "Very Good",
      "color": "#3B82F6",
      "badge": "⭐"
    },
    "breakdown": {
      "socialVerification": 0.9,
      "legitimacyScore": 0.8,
      "behaviorScore": 0.85,
      "fraudScore": 0.9,
      "transactionHistory": 0.8,
      "productQuality": 0.85
    }
  }
}
```

### **Legitimacy Monitoring Response**
```json
{
  "success": true,
  "message": "Legitimacy monitoring completed",
  "data": {
    "success": true,
    "userId": 1,
    "overallScore": 0.85,
    "results": [
      {
        "platform": "instagram",
        "success": true,
        "legitimacyScore": 0.9,
        "riskLevel": "low",
        "changes": [],
        "suspiciousPatterns": {
          "fakeFollowers": false,
          "botActivity": false,
          "spamContent": false,
          "stolenContent": false,
          "unusualBehavior": false
        }
      }
    ]
  }
}
```

## 🔧 **Testing with Postman**

### **Import Collection**
Create a Postman collection with these requests:

1. **Register User** - `POST /api/v1/auth/register`
2. **Login User** - `POST /api/v1/auth/login`
3. **Link Instagram** - `POST /api/v1/ai/social/link`
4. **Link Facebook** - `POST /api/v1/ai/social/link`
5. **Link WhatsApp** - `POST /api/v1/ai/social/link`
6. **Get Linked Accounts** - `GET /api/v1/ai/social/accounts`
7. **Monitor Legitimacy** - `POST /api/v1/ai/legitimacy/monitor`
8. **Monitor Behavior** - `POST /api/v1/ai/behavior/monitor`
9. **Calculate Seller Score** - `POST /api/v1/ai/seller/score`
10. **Get Seller Score** - `GET /api/v1/ai/seller/score`
11. **Create Product** - `POST /api/v1/products`
12. **Verify Product** - `POST /api/v1/ai/product/verify`
13. **Get Top Sellers** - `GET /api/v1/ai/seller/top`
14. **Get AI Insights** - `GET /api/v1/ai/insights`

### **Environment Variables in Postman**
- `base_url`: `http://localhost:3033`
- `jwt_token`: (set after login)

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Database Connection Error**
   - Check `.env` file configuration
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **JWT Token Error**
   - Make sure to login first and get token
   - Include `Authorization: Bearer TOKEN` header
   - Check token expiration

3. **AI Service Not Initialized**
   - Check server logs for initialization errors
   - Restart server if needed
   - Verify all dependencies are installed

4. **Migration Errors**
   - Check database permissions
   - Ensure database exists
   - Run migrations in correct order

### **Debug Mode**

Add debug logging by setting:
```env
NODE_ENV=development
DEBUG=trustmart:ai
```

## 📊 **Performance Testing**

### **Load Testing with Artillery**

```bash
# Install Artillery
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'http://localhost:3033'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "AI API Load Test"
    requests:
      - get:
          url: "/api/v1/ai/seller/top"
      - post:
          url: "/api/v1/ai/legitimacy/monitor"
          headers:
            Authorization: "Bearer YOUR_JWT_TOKEN"
EOF

# Run load test
artillery run load-test.yml
```

## ✅ **Test Checklist**

- [ ] Server starts without errors
- [ ] Database migrations run successfully
- [ ] User registration/login works
- [ ] Social account linking works for all platforms
- [ ] Legitimacy monitoring returns valid scores
- [ ] Behavior monitoring detects patterns
- [ ] Seller score calculation works
- [ ] Product verification processes correctly
- [ ] Top sellers endpoint returns data
- [ ] AI insights endpoint works
- [ ] Batch processing handles multiple items
- [ ] Error handling works correctly
- [ ] Authentication protects endpoints
- [ ] Performance is acceptable

## 🎉 **Success Criteria**

The AI system is working correctly if:
1. All endpoints return 200 status codes
2. Seller scores are calculated between 0-1
3. Risk levels are properly categorized
4. Social accounts are linked and verified
5. Monitoring detects suspicious patterns
6. System handles errors gracefully
7. Performance is under 2 seconds per request

---

**Happy Testing! 🚀**
