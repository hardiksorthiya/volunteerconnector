#!/bin/bash
# Clear Cache Script for React Native/Expo

echo "🧹 Clearing React Native/Expo cache..."

# Stop any running Metro bundler processes
echo "Stopping Metro bundler..."
pkill -f metro || true

# Clear Metro bundler cache
echo "Clearing Metro cache..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Clear node_modules cache
echo "Clearing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf .expo 2>/dev/null || true

# Clear watchman (if exists)
echo "Clearing watchman cache..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
fi

echo "✅ Cache cleared! Now run: npx expo start --clear"

