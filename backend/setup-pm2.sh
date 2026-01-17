#!/bin/bash

# Setup PM2 for Volunteer Connect Backend
# This script installs PM2 and sets up the backend to run automatically

cd "$(dirname "$0")"

echo "🚀 Setting up PM2 for Volunteer Connect Backend..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found."
    echo ""
    echo "📦 Would you like to install Node.js now? (requires root/sudo)"
    echo "   Run: sudo ./install-nodejs.sh"
    echo "   Or install manually and then run this script again."
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
pm2 delete volunteer-connect-backend 2>/dev/null || true

# Start the application with PM2
echo "🔄 Starting backend with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system reboot
echo "🔧 Setting up PM2 startup script..."
pm2 startup

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Useful PM2 commands:"
echo "   pm2 status              - Check status"
echo "   pm2 logs                - View logs"
echo "   pm2 restart volunteer-connect-backend  - Restart"
echo "   pm2 stop volunteer-connect-backend     - Stop"
echo "   pm2 delete volunteer-connect-backend   - Remove from PM2"
echo ""

