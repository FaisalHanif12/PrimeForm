#!/bin/bash

# Script to automatically update IP address in configuration files
# This helps when you switch networks (WiFi, mobile data, etc.)

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Detecting current network IP address...${NC}"

# Get current IP address (excluding localhost)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}❌ Could not detect IP address. Make sure you're connected to a network.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Current IP: ${CURRENT_IP}${NC}"

# Read the first IP from the config file
FRONTEND_CONFIG="Frontend/PrimeForm/src/config/api.ts"
BACKEND_CONFIG="Backend/server.js"

# Extract the current primary IP from frontend config
OLD_IP=$(grep -m 1 "http://192.168" "$FRONTEND_CONFIG" | sed -E "s/.*http:\/\/([0-9.]+):.*/\1/" | tr -d "',")

echo -e "${YELLOW}📝 Previous IP in config: ${OLD_IP}${NC}"

if [ "$CURRENT_IP" == "$OLD_IP" ]; then
    echo -e "${GREEN}✅ IP address is already up to date!${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Updating configuration files...${NC}"

# Backup files
cp "$FRONTEND_CONFIG" "$FRONTEND_CONFIG.backup"
cp "$BACKEND_CONFIG" "$BACKEND_CONFIG.backup"

# Update frontend config - move current IP to top and old IP to fallback
sed -i '' "s|'http://${OLD_IP}:|'http://${CURRENT_IP}:|" "$FRONTEND_CONFIG"
sed -i '' "s|// Primary: your CURRENT network IP|// Primary: your CURRENT network IP|" "$FRONTEND_CONFIG"

# Update backend config
sed -i '' "s|'http://${OLD_IP}:|'http://${CURRENT_IP}:|g" "$BACKEND_CONFIG"
sed -i '' "s|'exp://${OLD_IP}:|'exp://${CURRENT_IP}:|g" "$BACKEND_CONFIG"
sed -i '' "s|http://${OLD_IP}:|http://${CURRENT_IP}:|g" "$BACKEND_CONFIG"

echo -e "${GREEN}✅ Configuration updated successfully!${NC}"
echo -e "${YELLOW}📋 Summary:${NC}"
echo -e "   Old IP: ${OLD_IP}"
echo -e "   New IP: ${CURRENT_IP}"
echo -e ""
echo -e "${YELLOW}🔄 Next steps:${NC}"
echo -e "   1. Restart your backend server (cd Backend && npm start)"
echo -e "   2. Restart your Expo app (npx expo start --clear)"
echo -e ""
echo -e "${GREEN}💡 Tip: Run this script whenever you switch networks!${NC}"


