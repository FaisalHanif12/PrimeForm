#!/bin/bash

# 🔔 FCM Configuration Script for Pure Body Backend
# This script helps you configure Firebase Cloud Messaging for push notifications

echo "================================================"
echo "🔔 Pure Body - FCM Configuration Helper"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on VPS or local
if [ "$EUID" -eq 0 ]; then 
    echo -e "${GREEN}✅ Running as root (VPS detected)${NC}"
    IS_VPS=true
    BACKEND_PATH="/var/www/purebody-backend"
else
    echo -e "${YELLOW}⚠️  Not running as root (Local machine detected)${NC}"
    IS_VPS=false
    BACKEND_PATH="$(pwd)"
fi

echo ""
echo "Backend Path: $BACKEND_PATH"
echo ""

# Function to add or update env variable
add_env_variable() {
    local key=$1
    local value=$2
    local env_file="$BACKEND_PATH/.env"
    
    # Check if .env exists
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ .env file not found at: $env_file${NC}"
        echo -e "${YELLOW}Creating new .env file...${NC}"
        touch "$env_file"
    fi
    
    # Check if key already exists
    if grep -q "^${key}=" "$env_file"; then
        # Update existing key
        echo -e "${YELLOW}Updating existing ${key}...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
    else
        # Add new key
        echo -e "${YELLOW}Adding new ${key}...${NC}"
        echo "${key}=${value}" >> "$env_file"
    fi
    
    echo -e "${GREEN}✅ ${key} configured${NC}"
}

# Main configuration flow
echo "================================================"
echo "Step 1: Get FCM Server Key from Firebase"
echo "================================================"
echo ""
echo "1. Go to: https://console.firebase.google.com/"
echo "2. Select project: purebody-70f44"
echo "3. Click gear icon (⚙️) > Project Settings"
echo "4. Go to: Cloud Messaging tab"
echo "5. Copy the 'Server key' (starts with AAAA...)"
echo ""
read -p "Do you have your FCM Server Key ready? (y/n): " HAS_KEY

if [ "$HAS_KEY" != "y" ] && [ "$HAS_KEY" != "Y" ]; then
    echo ""
    echo -e "${YELLOW}Please get your FCM Server Key first and run this script again.${NC}"
    exit 1
fi

echo ""
read -p "Enter your FCM Server Key (starts with AAAA...): " FCM_KEY

if [ -z "$FCM_KEY" ]; then
    echo -e "${RED}❌ FCM Server Key cannot be empty${NC}"
    exit 1
fi

# Validate FCM key format (should start with AAAA)
if [[ ! "$FCM_KEY" =~ ^AAAA ]]; then
    echo -e "${YELLOW}⚠️  Warning: FCM Server Keys usually start with 'AAAA'${NC}"
    read -p "Are you sure this is correct? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "Cancelled."
        exit 1
    fi
fi

# Add FCM Server Key to .env
add_env_variable "FCM_SERVER_KEY" "$FCM_KEY"

echo ""
echo "================================================"
echo "Step 2: (Optional) Expo Access Token"
echo "================================================"
echo ""
echo "For enhanced push notification features, you can add an Expo Access Token."
echo "Get it from: https://expo.dev/accounts/[your-account]/settings/access-tokens"
echo ""
read -p "Do you want to add an Expo Access Token? (y/n): " HAS_EXPO_TOKEN

if [ "$HAS_EXPO_TOKEN" = "y" ] || [ "$HAS_EXPO_TOKEN" = "Y" ]; then
    read -p "Enter your Expo Access Token: " EXPO_TOKEN
    if [ ! -z "$EXPO_TOKEN" ]; then
        add_env_variable "EXPO_ACCESS_TOKEN" "$EXPO_TOKEN"
    fi
fi

echo ""
echo "================================================"
echo "✅ Configuration Complete!"
echo "================================================"
echo ""

# Display current configuration (masked)
echo "Current Configuration:"
echo "---------------------"
if [ -f "$BACKEND_PATH/.env" ]; then
    if grep -q "^FCM_SERVER_KEY=" "$BACKEND_PATH/.env"; then
        FCM_VALUE=$(grep "^FCM_SERVER_KEY=" "$BACKEND_PATH/.env" | cut -d'=' -f2)
        FCM_MASKED="${FCM_VALUE:0:10}...${FCM_VALUE: -10}"
        echo "FCM_SERVER_KEY: $FCM_MASKED"
    fi
    if grep -q "^EXPO_ACCESS_TOKEN=" "$BACKEND_PATH/.env"; then
        echo "EXPO_ACCESS_TOKEN: Configured ✅"
    fi
fi
echo ""

# Restart backend if on VPS
if [ "$IS_VPS" = true ]; then
    echo "================================================"
    echo "Step 3: Restart Backend"
    echo "================================================"
    echo ""
    read -p "Do you want to restart the backend now? (y/n): " RESTART
    
    if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
        echo ""
        echo "Restarting backend..."
        pm2 restart purebody-backend
        echo ""
        echo -e "${GREEN}✅ Backend restarted${NC}"
        echo ""
        echo "Checking logs for FCM configuration..."
        sleep 2
        pm2 logs purebody-backend --lines 20 --nostream | grep -E "(PUSH SERVICE|FCM)"
    fi
else
    echo "================================================"
    echo "Next Steps (Run on VPS)"
    echo "================================================"
    echo ""
    echo "1. Upload this .env file to your VPS:"
    echo "   scp $BACKEND_PATH/.env root@srv1172333:/var/www/purebody-backend/"
    echo ""
    echo "2. SSH into VPS and restart backend:"
    echo "   ssh root@srv1172333"
    echo "   pm2 restart purebody-backend"
    echo "   pm2 logs purebody-backend --lines 50"
    echo ""
fi

echo ""
echo "================================================"
echo "Testing Push Notifications"
echo "================================================"
echo ""
echo "To test push notifications:"
echo "1. Install APK on Android device"
echo "2. Create a new account"
echo "3. Check backend logs:"
echo "   pm2 logs purebody-backend | grep 'PUSH'"
echo ""
echo "Expected logs:"
echo "  ✅ FCM Server Key detected in environment"
echo "  ✅ Push token saved to user document"
echo "  ✅ Push notification sent successfully"
echo ""
echo "If you see errors:"
echo "  ❌ Unable to retrieve the FCM server key"
echo "  → Check if FCM_SERVER_KEY is set correctly"
echo "  → Verify the key is valid in Firebase Console"
echo "  → Ensure Cloud Messaging API is enabled"
echo ""
echo -e "${GREEN}Configuration script completed!${NC}"
echo ""
