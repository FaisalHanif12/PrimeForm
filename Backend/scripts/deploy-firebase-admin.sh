#!/bin/bash

#######################################################
# Firebase Admin FCM v1 - VPS Deployment Script
#######################################################
# 
# This script automates the setup of Firebase Admin SDK
# for push notifications on your VPS.
#
# Usage:
#   ./deploy-firebase-admin.sh
#
# Prerequisites:
#   - Firebase service account JSON file downloaded
#   - SSH access to VPS
#   - PM2 running backend
#######################################################

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="srv1172333"
VPS_USER="root"
BACKEND_PATH="/var/www/purebody-backend"
LOCAL_BACKEND_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "========================================================"
echo "🔥 Firebase Admin FCM v1 - Deployment Script"
echo "========================================================"
echo ""

# Step 1: Check if service account file exists locally
echo -e "${BLUE}Step 1: Locating Firebase service account file...${NC}"
echo ""

SERVICE_ACCOUNT_FILE=""

# Check common locations
if [ -f "$LOCAL_BACKEND_PATH/config/firebase-service-account.json" ]; then
    SERVICE_ACCOUNT_FILE="$LOCAL_BACKEND_PATH/config/firebase-service-account.json"
elif [ -f "$HOME/Downloads/purebody-70f44-firebase-adminsdk-"*.json ]; then
    SERVICE_ACCOUNT_FILE=$(ls -t $HOME/Downloads/purebody-70f44-firebase-adminsdk-*.json | head -1)
elif [ -f "$HOME/Downloads/firebase-service-account.json" ]; then
    SERVICE_ACCOUNT_FILE="$HOME/Downloads/firebase-service-account.json"
else
    echo -e "${YELLOW}⚠️  Service account file not found automatically${NC}"
    echo ""
    read -p "Enter full path to your Firebase service account JSON file: " SERVICE_ACCOUNT_FILE
fi

if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $SERVICE_ACCOUNT_FILE${NC}"
    echo ""
    echo "Please download the service account key from:"
    echo "https://console.firebase.google.com/ > purebody-70f44 > Project Settings > Service Accounts"
    exit 1
fi

echo -e "${GREEN}✅ Found service account file: $SERVICE_ACCOUNT_FILE${NC}"
echo ""

# Step 2: Validate JSON file
echo -e "${BLUE}Step 2: Validating service account JSON...${NC}"
if python3 -m json.tool "$SERVICE_ACCOUNT_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ JSON file is valid${NC}"
else
    echo -e "${RED}❌ Error: Invalid JSON file${NC}"
    exit 1
fi

# Check required fields
if ! grep -q '"project_id"' "$SERVICE_ACCOUNT_FILE" || \
   ! grep -q '"private_key"' "$SERVICE_ACCOUNT_FILE" || \
   ! grep -q '"client_email"' "$SERVICE_ACCOUNT_FILE"; then
    echo -e "${RED}❌ Error: Service account JSON missing required fields${NC}"
    exit 1
fi

PROJECT_ID=$(grep '"project_id"' "$SERVICE_ACCOUNT_FILE" | cut -d'"' -f4)
echo "   Project ID: $PROJECT_ID"
echo ""

# Step 3: Test VPS connection
echo -e "${BLUE}Step 3: Testing VPS connection...${NC}"
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "exit" 2>/dev/null; then
    echo -e "${GREEN}✅ Connected to VPS${NC}"
else
    echo -e "${RED}❌ Error: Cannot connect to VPS${NC}"
    echo "Please check your SSH configuration"
    exit 1
fi
echo ""

# Step 4: Upload service account file
echo -e "${BLUE}Step 4: Uploading service account to VPS...${NC}"
echo "   Source: $SERVICE_ACCOUNT_FILE"
echo "   Destination: ${VPS_USER}@${VPS_HOST}:${BACKEND_PATH}/config/firebase-service-account.json"
echo ""

# Create config directory on VPS
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${BACKEND_PATH}/config"

# Upload file
scp "$SERVICE_ACCOUNT_FILE" "${VPS_USER}@${VPS_HOST}:${BACKEND_PATH}/config/firebase-service-account.json"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service account uploaded successfully${NC}"
else
    echo -e "${RED}❌ Error: Failed to upload service account${NC}"
    exit 1
fi
echo ""

# Step 5: Set correct permissions
echo -e "${BLUE}Step 5: Setting file permissions...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "chmod 600 ${BACKEND_PATH}/config/firebase-service-account.json"
ssh ${VPS_USER}@${VPS_HOST} "chown ${VPS_USER}:${VPS_USER} ${BACKEND_PATH}/config/firebase-service-account.json"
echo -e "${GREEN}✅ Permissions set (600)${NC}"
echo ""

# Step 6: Update .env file
echo -e "${BLUE}Step 6: Updating .env configuration...${NC}"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/purebody-backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating new .env file..."
    touch .env
fi

# Check if FIREBASE_SERVICE_ACCOUNT_PATH already exists
if grep -q "^FIREBASE_SERVICE_ACCOUNT_PATH=" .env; then
    echo "Updating existing FIREBASE_SERVICE_ACCOUNT_PATH..."
    sed -i 's|^FIREBASE_SERVICE_ACCOUNT_PATH=.*|FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json|' .env
else
    echo "Adding FIREBASE_SERVICE_ACCOUNT_PATH..."
    echo "" >> .env
    echo "# Firebase Admin SDK for push notifications (FCM v1)" >> .env
    echo "FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json" >> .env
fi

echo "✅ .env file updated"
ENDSSH

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 7: Install dependencies
echo -e "${BLUE}Step 7: Installing firebase-admin package...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "cd ${BACKEND_PATH} && npm install firebase-admin"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 8: Upload new service files
echo -e "${BLUE}Step 8: Uploading updated service files...${NC}"

if [ -f "$LOCAL_BACKEND_PATH/services/firebaseAdminService.js" ]; then
    scp "$LOCAL_BACKEND_PATH/services/firebaseAdminService.js" \
        "${VPS_USER}@${VPS_HOST}:${BACKEND_PATH}/services/"
    echo "   ✅ firebaseAdminService.js"
fi

if [ -f "$LOCAL_BACKEND_PATH/services/pushNotificationService.js" ]; then
    scp "$LOCAL_BACKEND_PATH/services/pushNotificationService.js" \
        "${VPS_USER}@${VPS_HOST}:${BACKEND_PATH}/services/"
    echo "   ✅ pushNotificationService.js"
fi

echo -e "${GREEN}✅ Service files updated${NC}"
echo ""

# Step 9: Update package.json
echo -e "${BLUE}Step 9: Updating package.json...${NC}"
if [ -f "$LOCAL_BACKEND_PATH/package.json" ]; then
    scp "$LOCAL_BACKEND_PATH/package.json" \
        "${VPS_USER}@${VPS_HOST}:${BACKEND_PATH}/"
    echo -e "${GREEN}✅ package.json updated${NC}"
fi
echo ""

# Step 10: Restart backend
echo -e "${BLUE}Step 10: Restarting backend...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "cd ${BACKEND_PATH} && pm2 restart purebody-backend"
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

# Step 11: Check logs
echo -e "${BLUE}Step 11: Checking initialization logs...${NC}"
echo ""
sleep 3  # Wait for backend to start

ssh ${VPS_USER}@${VPS_HOST} "pm2 logs purebody-backend --nostream --lines 30 | grep -E '(FIREBASE|PUSH SERVICE)'" || true

echo ""
echo "========================================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================================"
echo ""
echo "Next steps:"
echo "1. Monitor logs: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs purebody-backend'"
echo "2. Test with APK: Create new account and check for welcome notification"
echo "3. Verify no InvalidCredentials errors appear"
echo ""
echo "Expected logs:"
echo "   ✅ [FIREBASE ADMIN] Firebase Admin SDK initialized successfully"
echo "   ✅ [PUSH SERVICE] Push notifications ready"
echo ""
echo "If you see errors, check: ${BACKEND_PATH}/config/firebase-service-account.json"
echo ""
