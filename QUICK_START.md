# 🚀 TrustMart AI System - Quick Start Guide

## **Prerequisites**
- Node.js (v16 or higher)
- PostgreSQL database
- Git

## **1. Setup Environment**

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd trust-mart-backend-js

# Run setup script
./setup-testing.sh
```

## **2. Configure Database**

Edit your `.env` file with your database credentials:

```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=trustmart_db
DB_HOST=localhost
DB_PORT=5432
```

## **3. Start the System**

```bash
# Run database migrations
npm run migrate

# Start the server
npm start
```

The server will start on `http://localhost:3033`

## **4. Test the AI System**

```bash
# Run comprehensive AI tests
npm test
```

This will test all AI endpoints and functionality.

## **5. Manual Testing**

### **Quick Health Check**
```bash
curl http://localhost:3033/api/v1/health
```

### **Test Social Account Linking**
```bash
# Register a user first
curl -X POST http://localhost:3033/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login to get JWT token
curl -X POST http://localhost:3033/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Link Instagram account (replace YOUR_JWT_TOKEN)
curl -X POST http://localhost:3033/api/v1/ai/social/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"platform":"instagram","accountData":{"username":"testuser_ig","id":"ig_123"}}'
```

## **6. Available Commands**

```bash
npm start          # Start the server
npm run dev        # Start with nodemon (auto-restart)
npm test           # Run AI system tests
npm run migrate    # Run database migrations
npm run setup      # Run setup script
```

## **7. API Endpoints**

### **Authentication**
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user

### **AI Services**
- `POST /api/v1/ai/social/link` - Link social account
- `GET /api/v1/ai/social/accounts` - Get linked accounts
- `POST /api/v1/ai/legitimacy/monitor` - Monitor legitimacy
- `POST /api/v1/ai/behavior/monitor` - Monitor behavior
- `POST /api/v1/ai/seller/score` - Calculate seller score
- `GET /api/v1/ai/seller/score` - Get seller score
- `GET /api/v1/ai/seller/top` - Get top sellers
- `GET /api/v1/ai/insights` - Get AI insights

## **8. Expected Results**

When everything is working correctly, you should see:

✅ **Server Health Check** - Returns 200 OK
✅ **User Registration** - Creates user successfully
✅ **Social Account Linking** - Links accounts with verification scores
✅ **Legitimacy Monitoring** - Returns legitimacy scores and risk levels
✅ **Behavior Monitoring** - Analyzes user behavior patterns
✅ **Seller Scoring** - Calculates comprehensive seller scores
✅ **AI Insights** - Provides system-wide analytics

## **9. Troubleshooting**

### **Database Connection Issues**
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `trustmart_db` exists

### **JWT Token Issues**
- Make sure to login first to get token
- Include `Authorization: Bearer TOKEN` header
- Check token hasn't expired

### **AI Service Issues**
- Check server logs for initialization errors
- Restart server if needed
- Verify all dependencies are installed

## **10. Next Steps**

1. **Explore the API** - Use Postman or curl to test endpoints
2. **Check Logs** - Monitor server logs for any issues
3. **Customize** - Modify AI algorithms in the services
4. **Scale** - Add more social platforms or features
5. **Deploy** - Deploy to production when ready

## **📚 Documentation**

- **Detailed Testing**: `TESTING_GUIDE.md`
- **Implementation Flow**: `AI_IMPLEMENTATION_FLOW.md`
- **API Documentation**: Check individual service files

## **🎉 Success!**

If you see all green checkmarks in the test output, your TrustMart AI system is working perfectly!

---

**Happy Testing! 🚀**
