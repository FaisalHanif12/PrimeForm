#!/bin/bash

# 🧪 Push Notification Testing Script
# Tests if push notifications are configured correctly

echo "================================================"
echo "🧪 Pure Body - Push Notification Test"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on VPS
if [ "$EUID" -eq 0 ]; then 
    BACKEND_PATH="/var/www/purebody-backend"
else
    BACKEND_PATH="$(pwd)"
fi

# Test counters
PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
    fi
    echo ""
}

echo "Backend Path: $BACKEND_PATH"
echo ""

# ==========================================
# Test 1: Check if .env file exists
# ==========================================
run_test "Environment file exists" "[ -f '$BACKEND_PATH/.env' ]"

# ==========================================
# Test 2: Check if FCM_SERVER_KEY is set
# ==========================================
echo -e "${BLUE}Testing: FCM Server Key is configured${NC}"
if [ -f "$BACKEND_PATH/.env" ]; then
    if grep -q "^FCM_SERVER_KEY=" "$BACKEND_PATH/.env"; then
        FCM_KEY=$(grep "^FCM_SERVER_KEY=" "$BACKEND_PATH/.env" | cut -d'=' -f2)
        if [ ! -z "$FCM_KEY" ] && [[ "$FCM_KEY" =~ ^AAAA ]]; then
            echo -e "${GREEN}✅ PASSED - FCM key is set and starts with AAAA${NC}"
            echo "   Key: ${FCM_KEY:0:10}...${FCM_KEY: -10}"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAILED - FCM key format is invalid${NC}"
            echo "   Expected: Key starting with AAAA"
            echo "   Got: $FCM_KEY"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ FAILED - FCM_SERVER_KEY not found in .env${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAILED - .env file not found${NC}"
    ((FAILED++))
fi
echo ""

# ==========================================
# Test 3: Check if backend is running
# ==========================================
echo -e "${BLUE}Testing: Backend is running${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "purebody-backend.*online"; then
        echo -e "${GREEN}✅ PASSED - Backend is online${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED - Backend is not running or not found${NC}"
        echo "   Run: pm2 start purebody-backend"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED - PM2 not found (running locally?)${NC}"
fi
echo ""

# ==========================================
# Test 4: Check recent logs for FCM
# ==========================================
echo -e "${BLUE}Testing: FCM configuration in logs${NC}"
if command -v pm2 &> /dev/null; then
    LOGS=$(pm2 logs purebody-backend --nostream --lines 100 2>/dev/null)
    if echo "$LOGS" | grep -q "FCM Server Key detected"; then
        echo -e "${GREEN}✅ PASSED - FCM configuration detected in logs${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARNING - FCM configuration not found in recent logs${NC}"
        echo "   This might mean:"
        echo "   1. Backend was restarted before FCM key was added"
        echo "   2. Backend needs to be restarted"
        echo "   Run: pm2 restart purebody-backend"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED - PM2 not found${NC}"
fi
echo ""

# ==========================================
# Test 5: Check for recent push errors
# ==========================================
echo -e "${BLUE}Testing: No recent push notification errors${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 logs purebody-backend --nostream --lines 100 2>/dev/null | grep -q "InvalidCredentials"; then
        echo -e "${RED}❌ FAILED - InvalidCredentials error found in logs${NC}"
        echo "   This means FCM key is invalid or not being used"
        echo "   Solutions:"
        echo "   1. Verify FCM_SERVER_KEY in .env is correct"
        echo "   2. Restart backend: pm2 restart purebody-backend"
        echo "   3. Check Firebase Console for valid key"
        ((FAILED++))
    else
        echo -e "${GREEN}✅ PASSED - No InvalidCredentials errors${NC}"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED - PM2 not found${NC}"
fi
echo ""

# ==========================================
# Test 6: Check Node modules
# ==========================================
echo -e "${BLUE}Testing: Required npm packages installed${NC}"
if [ -f "$BACKEND_PATH/package.json" ]; then
    if [ -d "$BACKEND_PATH/node_modules/expo-server-sdk" ]; then
        echo -e "${GREEN}✅ PASSED - expo-server-sdk is installed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED - expo-server-sdk not found${NC}"
        echo "   Run: npm install expo-server-sdk"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED - package.json not found${NC}"
fi
echo ""

# ==========================================
# Test 7: Check Firebase API status
# ==========================================
echo -e "${BLUE}Testing: Firebase project configuration${NC}"
if [ -f "$BACKEND_PATH/../Frontend/PrimeForm/android/app/google-services.json" ]; then
    PROJECT_ID=$(cat "$BACKEND_PATH/../Frontend/PrimeForm/android/app/google-services.json" | grep project_id | cut -d'"' -f4)
    if [ "$PROJECT_ID" = "purebody-70f44" ]; then
        echo -e "${GREEN}✅ PASSED - Firebase project ID matches${NC}"
        echo "   Project: $PROJECT_ID"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED - Firebase project ID mismatch${NC}"
        echo "   Expected: purebody-70f44"
        echo "   Got: $PROJECT_ID"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED - google-services.json not found${NC}"
fi
echo ""

# ==========================================
# Summary
# ==========================================
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo ""
echo -e "Tests Passed:  ${GREEN}$PASSED${NC}"
echo -e "Tests Failed:  ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Your push notification configuration looks good."
    echo ""
    echo "Next steps:"
    echo "1. Install APK on Android device"
    echo "2. Create a new account"
    echo "3. Check if welcome notification appears"
    echo ""
    echo "Monitor logs:"
    echo "  pm2 logs purebody-backend | grep 'PUSH'"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Please fix the issues above and run this test again."
    echo ""
    echo "Common fixes:"
    echo "1. Add FCM_SERVER_KEY to .env:"
    echo "   nano /var/www/purebody-backend/.env"
    echo "   Add: FCM_SERVER_KEY=AAAAxxxxxxxxxxxxxxxx"
    echo ""
    echo "2. Restart backend:"
    echo "   pm2 restart purebody-backend"
    echo ""
    echo "3. Check logs:"
    echo "   pm2 logs purebody-backend --lines 50"
    echo ""
    exit 1
fi
