# API Call Flow Documentation

## Overview
This document explains how API calls are made in the PrimeForm app, specifically for the Diet Plan functionality.

## API Call Flow When Opening Diet Screen

### 1. **Initial Load (diet.tsx)**
When you navigate to the Diet screen (`app/(dashboard)/diet.tsx`):

```typescript
// Line 299-308 in diet.tsx
const loadDietPlan = async () => {
  const dietPlanFromDB = await aiDietService.loadDietPlanFromDatabase();
  // This triggers the API call chain
}
```

### 2. **AI Diet Service (aiDietService.ts)**
The `loadDietPlanFromDatabase()` method is called:

```typescript
// Line 252-315 in aiDietService.ts
async loadDietPlanFromDatabase(forceRefresh = false) {
  // First checks local cache (AsyncStorage)
  // If not found or forceRefresh=true, calls:
  const response = await dietPlanService.getActiveDietPlan();
}
```

### 3. **Diet Plan Service (dietPlanService.ts)**
The actual API call is made here:

```typescript
// Line 80-96 in dietPlanService.ts
async getActiveDietPlan(): Promise<DietPlanResponse> {
  console.log('📱 Loading diet plan from database...');
  const response = await api.get('/diet-plans/active');
  // This makes: GET http://192.168.48.129:5001/api/diet-plans/active
  return response;
}
```

### 4. **API Client (api.ts)**
The API client handles the HTTP request:

```typescript
// Line 71-138 in api.ts
private async request(endpoint: string, options: RequestInit = {}) {
  const url = `${this.baseURL}${endpoint}`;
  // baseURL = 'http://192.168.48.129:5001/api'
  // endpoint = '/diet-plans/active'
  // Full URL: http://192.168.48.129:5001/api/diet-plans/active
  
  // Gets auth token from AsyncStorage
  const token = await this.getAuthToken();
  
  // Adds Authorization header
  headers['Authorization'] = `Bearer ${token}`;
  
  // Makes fetch request
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
}
```

### 5. **Backend Route (Backend/routes/dietPlanRoutes.js)**
The backend receives the request:

```javascript
// Line 22 in dietPlanRoutes.js
router.get('/active', getUserDietPlan);  // GET /api/diet-plans/active
```

### 6. **Backend Controller (Backend/controllers/dietPlanController.js)**
The controller processes the request:

```javascript
// Line 180-215 in dietPlanController.js
const getUserDietPlan = async (req, res) => {
  const userId = req.user._id.toString();  // From JWT token
  const dietPlan = await DietPlan.getActiveDietPlan(userId);
  
  res.json({
    success: true,
    message: 'Diet plan retrieved successfully',
    data: dietPlan
  });
}
```

---

## API Calls When Completing Meals/Days

### 1. **Mark Meal as Completed**

**Frontend Flow:**
```typescript
// mealCompletionService.ts (Line 67-96)
async markMealCompleted(mealId, dayDate, dayNumber, weekNumber, mealType) {
  // Updates local storage first
  await this.saveToStorage();
  
  // Then calls API
  await dietPlanService.markMealCompleted(mealId, dayNumber, weekNumber, mealType);
}
```

**API Call:**
```typescript
// dietPlanService.ts (Line 110-121)
async markMealCompleted(mealId, day, week, mealType) {
  const response = await api.post('/diet-plans/meal/complete', {
    mealId,
    day,
    week,
    mealType
  });
  // POST http://192.168.48.129:5001/api/diet-plans/meal/complete
}
```

**Backend Route:**
```javascript
// Backend/routes/dietPlanRoutes.js
router.post('/meal/complete', markMealCompleted);
```

### 2. **Mark Day as Completed**

**Frontend Flow:**
```typescript
// mealCompletionService.ts
async markDayCompleted(dayDate, dayNumber, weekNumber) {
  await dietPlanService.markDayCompleted(dayNumber, weekNumber);
}
```

**API Call:**
```typescript
// dietPlanService.ts (Line 124-130)
async markDayCompleted(day, week) {
  const response = await api.post('/diet-plans/day/complete', {
    day,
    week
  });
  // POST http://192.168.48.129:5001/api/diet-plans/day/complete
}
```

**Backend Route:**
```javascript
// Backend/routes/dietPlanRoutes.js
router.post('/day/complete', markDayCompleted);
```

---

## Multiple API Calls Explained

Based on your console logs, here's why you see multiple API calls:

### 1. **Initial Load (diet.tsx)**
- `loadDietPlan()` → Calls `aiDietService.loadDietPlanFromDatabase()`
- This makes: `GET /api/diet-plans/active`

### 2. **DietPlanDisplay Component Mount**
When `DietPlanDisplay` component mounts:

```typescript
// DietPlanDisplay.tsx (Line 271-302)
useEffect(() => {
  const initializeComponent = async () => {
    await mealCompletionService.initialize();
    loadCompletionStates();  // This calls API again
  };
}, [dietPlan]);
```

### 3. **loadCompletionStates() Function**
This function is called multiple times:

```typescript
// DietPlanDisplay.tsx (Line 363-400)
const loadCompletionStates = async () => {
  // Line 366: Makes another API call
  const dietPlan = await dietPlanService.getActiveDietPlan();
  // GET /api/diet-plans/active
}
```

### 4. **Event Listeners Trigger Reloads**
Multiple event listeners can trigger `loadCompletionStates()`:

```typescript
// DietPlanDisplay.tsx (Line 321-355)
useEffect(() => {
  // Listens for these events and reloads:
  DeviceEventEmitter.addListener('mealCompleted', () => loadCompletionStates());
  DeviceEventEmitter.addListener('dayCompleted', () => loadCompletionStates());
  DeviceEventEmitter.addListener('dietProgressUpdated', () => loadCompletionStates());
  DeviceEventEmitter.addListener('waterIntakeUpdated', () => loadCompletionStates());
}, []);
```

### 5. **Focus Effect (useFocusEffect)**
When screen comes into focus:

```typescript
// DietPlanDisplay.tsx (Line 307-318)
useFocusEffect(() => {
  if (isInitialized && now - lastFocusTime.current > 2000) {
    loadCompletionStates();  // Another API call
  }
});
```

---

## API Call Sequence from Your Logs

Based on your console output, here's the sequence:

1. **Line 1-2**: App refresh, initial load
2. **Line 8-13**: First API call - `GET /api/diet-plans/active` (from diet.tsx)
3. **Line 14-15**: Load completed meals from database response
4. **Line 68-70**: Second API call - `GET /api/diet-plans/active` (from DietPlanDisplay mount)
5. **Line 101-105**: Third API call - `POST /api/diet-plans/day/complete` (when marking day complete)
6. **Line 119-128**: Fourth API call - `GET /api/diet-plans/active` (after day completion event)
7. **Line 144-147**: Fifth API call - `GET /api/diet-plans/active` (dietProgressUpdated event)
8. **Line 180-182**: Sixth API call - `GET /api/diet-plans/active` (another reload)

---

## Optimization Opportunities

### Current Issues:
1. **Multiple redundant calls**: `getActiveDietPlan()` is called multiple times
2. **No request deduplication**: Same API call made simultaneously from different components
3. **Cache not fully utilized**: Even with cache, multiple calls still happen

### Recommendations:
1. **Add request deduplication** in `api.ts` to prevent duplicate simultaneous requests
2. **Better cache management** - Check cache before making API calls
3. **Debounce `loadCompletionStates()`** to prevent rapid successive calls
4. **Use React Query or SWR** for better caching and request management

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Called From |
|----------|--------|---------|-------------|
| `/diet-plans/active` | GET | Get active diet plan | `dietPlanService.getActiveDietPlan()` |
| `/diet-plans/meal/complete` | POST | Mark meal as completed | `dietPlanService.markMealCompleted()` |
| `/diet-plans/day/complete` | POST | Mark day as completed | `dietPlanService.markDayCompleted()` |

---

## Authentication Flow

All API calls include authentication:

1. **Token Storage**: JWT token stored in AsyncStorage as `authToken`
2. **Token Retrieval**: `api.ts` gets token before each request
3. **Header Addition**: Token added as `Authorization: Bearer <token>`
4. **Backend Validation**: Backend middleware validates token before processing

```typescript
// api.ts (Line 60-68)
private async getAuthToken(): Promise<string | null> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  return await AsyncStorage.default.getItem('authToken');
}

// api.ts (Line 91-93)
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

