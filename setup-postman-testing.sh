#!/bin/bash

echo "🚀 Setting up TrustMart AI System for Postman Testing..."

# Check if server is running
if ! curl -s http://localhost:3033/api/v1/health > /dev/null; then
    echo "⚠️  Server is not running. Starting server..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "❌ .env file not found. Please run ./setup-testing.sh first"
        exit 1
    fi
    
    # Start server in background
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    sleep 5
    
    # Check if server started successfully
    if curl -s http://localhost:3033/api/v1/health > /dev/null; then
        echo "✅ Server started successfully (PID: $SERVER_PID)"
    else
        echo "❌ Failed to start server"
        exit 1
    fi
else
    echo "✅ Server is already running"
fi

echo ""
echo "📋 Postman Testing Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Open Postman"
echo "2. Import the collection: TrustMart_AI_Postman_Collection.json"
echo "3. Follow the testing sequence in POSTMAN_TESTING_GUIDE.md"
echo ""
echo "🔧 Quick Test Commands:"
echo "   Health Check:     curl http://localhost:3033/api/v1/health"
echo "   Register User:    curl -X POST http://localhost:3033/api/v1/auth/register -H 'Content-Type: application/json' -d '{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}'"
echo ""
echo "📚 Documentation:"
echo "   - POSTMAN_TESTING_GUIDE.md - Complete testing guide"
echo "   - QUICK_START.md - Quick setup guide"
echo "   - AI_IMPLEMENTATION_FLOW.md - System overview"
echo ""
echo "✅ Ready for Postman testing!"
