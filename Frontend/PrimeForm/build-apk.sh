#!/bin/bash

# Script to build Android APK
# This will create an EAS project if needed and build the APK

echo "🚀 Starting Android APK build..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing now..."
    npm install -g eas-cli
fi

# Check if logged in
echo "Checking EAS login status..."
eas whoami

# Build APK
echo ""
echo "📦 Building Android APK (this may take 10-20 minutes)..."
echo "When prompted, type 'y' to create the EAS project if needed."
echo ""

eas build --platform android --profile preview

echo ""
echo "✅ Build process completed!"
echo "Check your email or visit https://expo.dev to download your APK"

