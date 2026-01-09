# 🧪 Testing Checklist for APK

## ✅ **Working Features:**
1. ✅ **Banner Ads** - Test banner ad displaying at bottom
2. ✅ **App Navigation** - All screens loading properly
3. ✅ **User Authentication** - Login/signup working

## ❌ **Issues to Fix:**

### **1. Rewarded Ad in AI Trainer Not Showing**

**Symptoms:**
- Click send button in AI Trainer
- Nothing happens (no ad shown)
- Message not sent

**Possible Causes:**
- Ad loading timeout
- Test ad inventory unavailable
- Error in ad callbacks
- Network issue

**Debug Steps:**
1. Check device logs for errors
2. Verify internet connection is stable
3. Try different time (test ad inventory varies)
4. Check if graceful degradation is working

**Expected Logs (when working):**
```
🎬 [AI TRAINER] === handleSendMessage CALLED ===
🎬 [AI TRAINER] User ID: <id>
📺 [AI TRAINER] Ad NOT watched today - showing rewarded ad...
🎬 [REWARDED AD] === showRewardedAd CALLED ===
✅ [REWARDED AD] AdMob module loaded successfully
✅ [REWARDED AD] EVENT: Ad LOADED successfully
```

**If ad fails but message still not sent:**
- Check if `onError` callback is working
- Verify graceful degradation is implemented

---

### **2. Push Notifications**

**Backend Requirements:**
1. ✅ Firebase Service Account uploaded to EAS
2. ⏳ Backend needs to be configured (Hostinger)
3. ⏳ Daily scheduled notifications setup

**Push Notification Flow:**

```
Backend (Hostinger) → Expo Push Service → Firebase → App
```

**What backend needs:**
- Nothing! Backend uses Expo Server SDK
- Expo handles Firebase routing
- EAS build registers credentials with Expo

**Scheduled Notifications:**

| Time | Type | Description |
|------|------|-------------|
| Once | Welcome | On signup |
| Daily | Diet | Morning reminder |
| Daily | Workout | Afternoon reminder |
| Daily | Gym | Evening reminder |

---

## 🔧 **FIXES NEEDED:**

### **Fix 1: Improve Rewarded Ad Error Handling**

Current code in `ai-trainer.tsx`:
```typescript
onError: (error) => {
  console.error('❌ [AI TRAINER] Rewarded ad error:', error);
  showToast('warning', 'Ad could not be loaded. Proceeding with message...');
  proceedWithSendingMessage(); // ✅ This should allow message to send
}
```

**This SHOULD work, but let's verify:**
1. Ad load fails
2. `onError` triggered
3. Toast shown
4. Message sent anyway

**If message not sending:**
- Error callback not being called
- Exception thrown before callback
- Need to add try-catch around showRewardedAd call

---

### **Fix 2: Add Fallback Timer for Ads**

If ad doesn't load within 10 seconds → proceed anyway:

```typescript
// Set timeout
const adTimeout = setTimeout(() => {
  log('⏱️ Ad load timeout - proceeding without ad');
  proceedWithSendingMessage();
}, 10000); // 10 seconds

showRewardedAd(AdUnits.rewardedTrainer, {
  onEarned: async () => {
    clearTimeout(adTimeout);
    // ... proceed
  },
  onError: (error) => {
    clearTimeout(adTimeout);
    // ... proceed
  },
  onClosed: () => {
    clearTimeout(adTimeout);
    // Ad closed without watching - don't send
  }
});
```

---

### **Fix 3: Verify Push Notification Backend**

**Check backend logs for:**
```
✅ Push notification sent to user <user-id>
✅ Ticket status: ok
```

**If still showing "InvalidCredentials":**
- EAS secret not registered yet
- Need to rebuild APK
- Firebase credentials not linked

**Solution:**
- Rebuild APK (current build should work)
- EAS registers Firebase with Expo during build
- Backend will work automatically

---

## 📱 **TESTING COMMANDS:**

### **Check device logs:**
```bash
# Clear logs first
adb logcat -c

# Monitor specific logs
adb logcat | grep -E "AI TRAINER|REWARDED AD|ADMOB"

# Monitor push notifications
adb logcat | grep -E "PUSH|NOTIFICATION"

# Save logs to file
adb logcat | grep -E "AI TRAINER|REWARDED AD" > ai_trainer_logs.txt
```

### **Test scenarios:**

**Scenario 1: AI Trainer with ad**
1. Open AI Trainer
2. Type "Hello"
3. Click Send
4. **Expected:** Ad shows OR toast + message sent
5. **Current:** Nothing happens ❌

**Scenario 2: Push notification**
1. Create new account
2. **Expected:** Welcome notification
3. **Current:** Not tested yet

---

## 🎯 **NEXT STEPS:**

1. **Collect device logs** from AI Trainer test
2. **Identify why message not sending** (even on ad error)
3. **Add timeout fallback** for ad loading
4. **Test push notifications** after rebuild
5. **Verify daily scheduled notifications** working

---

## 📊 **EXPECTED vs ACTUAL:**

| Feature | Expected | Actual | Status |
|---------|----------|--------|--------|
| Banner Ads | Show | Show | ✅ |
| AI Trainer Ad | Show or proceed | Nothing | ❌ |
| Push (Welcome) | Send | Not tested | ⏳ |
| Push (Daily) | Send | Not tested | ⏳ |
| Ad Logging | Verbose | Verbose | ✅ |

---

## 💡 **IMMEDIATE ACTION:**

**For you to do:**
1. Open AI Trainer
2. Type message
3. Click Send
4. **Copy ALL logs from terminal**
5. Share logs here

**Command to get logs:**
```bash
adb logcat | grep -E "AI TRAINER|REWARDED|ERROR"
```

This will show us exactly where it's failing!
