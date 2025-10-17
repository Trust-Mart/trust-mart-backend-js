#!/bin/bash

# TrustMart AI System Testing Setup Script

echo "🚀 Setting up TrustMart AI System for Testing..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating sample .env file..."
    cat > .env << EOF
# Database Configuration
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=trustmart_db
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3033
NODE_ENV=development
API_VERSION=1
EOF
    echo "✅ Sample .env file created. Please update with your actual database credentials."
else
    echo "✅ .env file exists"
fi

# Check if PostgreSQL is running (optional)
if command -v psql &> /dev/null; then
    echo "🐘 PostgreSQL is available"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL and create a database."
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update your .env file with correct database credentials"
echo "2. Create a PostgreSQL database named 'trustmart_db'"
echo "3. Run: npx sequelize-cli db:migrate"
echo "4. Start the server: npm start"
echo "5. Run tests: node test-ai-system.js"
echo ""
echo "📚 For detailed testing instructions, see TESTING_GUIDE.md"
echo ""
echo "🔧 Quick Commands:"
echo "   Start server:     npm start"
echo "   Run migrations:   npx sequelize-cli db:migrate"
echo "   Run tests:        node test-ai-system.js"
echo "   Health check:     curl http://localhost:3033/api/v1/health"
echo ""
echo "✅ Setup complete!"
