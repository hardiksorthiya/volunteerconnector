#!/bin/bash

# Setup PM2 for Volunteer Connect Frontend
# This script installs PM2 and sets up the frontend to run automatically

cd "$(dirname "$0")"

echo "🚀 Setting up PM2 for Volunteer Connect Frontend..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found."
    echo ""
    echo "📦 Please install Node.js first."
    echo ""
    exit 1
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
pm2 delete volunteer-connect-frontend 2>/dev/null || true

# Start the application with PM2
echo "🔄 Starting frontend with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system reboot (if not already done)
echo "🔧 Setting up PM2 startup script..."
pm2 startup 2>/dev/null || echo "⚠️  PM2 startup already configured"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Useful PM2 commands:"
echo "   pm2 status                        - Check status"
echo "   pm2 logs volunteer-connect-frontend  - View logs"
echo "   pm2 restart volunteer-connect-frontend  - Restart"
echo "   pm2 stop volunteer-connect-frontend     - Stop"
echo "   pm2 delete volunteer-connect-frontend   - Remove from PM2"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3001"
echo ""

