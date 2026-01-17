#!/bin/bash

# Install Node.js and npm on cPanel/RedHat/CentOS systems
# This script installs Node.js 20.x LTS (recommended version)

echo "🚀 Installing Node.js and npm..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/redhat-release ]; then
    OS="rhel"
    VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+' | head -1)
else
    OS="unknown"
fi

echo "📋 Detected OS: $OS version $VERSION"

# Install Node.js 20.x LTS via NodeSource
echo "📦 Setting up NodeSource repository for Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup NodeSource repository"
    echo "🔄 Trying alternative method..."
    
    # Alternative: Install from EPEL or use dnf/yum directly
    if command -v dnf &> /dev/null; then
        dnf install -y nodejs npm
    elif command -v yum &> /dev/null; then
        yum install -y nodejs npm
    else
        echo "❌ Could not find package manager (yum/dnf)"
        exit 1
    fi
else
    echo "✅ NodeSource repository configured"
    echo "📦 Installing Node.js and npm..."
    
    if command -v dnf &> /dev/null; then
        dnf install -y nodejs
    elif command -v yum &> /dev/null; then
        yum install -y nodejs
    fi
fi

# Verify installation
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo ""
    echo "✅ Node.js installed successfully!"
    echo "   Node.js version: $NODE_VERSION"
    echo "   npm version: $NPM_VERSION"
    echo ""
    echo "📍 Node.js location: $(which node)"
    echo "📍 npm location: $(which npm)"
    echo ""
else
    echo "❌ Installation failed. Node.js or npm not found."
    echo ""
    echo "💡 Alternative installation methods:"
    echo "   1. Use cPanel Node.js Selector (if available in cPanel)"
    echo "   2. Install via NVM (Node Version Manager)"
    echo "   3. Contact your hosting provider for Node.js installation"
    exit 1
fi

