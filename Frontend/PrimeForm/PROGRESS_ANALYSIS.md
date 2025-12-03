# Progress Page Data Accuracy Analysis

## Issues Identified

### 1. **Water Intake Calculation Issue** ⚠️ CRITICAL
**Location:** `progressService.ts` Line 164-175

**Problem:**
- When water is marked as "Done", it uses the stored amount from `water_intake`
- But it should use the **target water amount from the diet plan** for that specific day
- Currently, if the stored amount is wrong or missing, it won't show 100%

**Fix Needed:**
- When `filteredWater.completed[date]` is true, get the target water from `dietPlan.weeklyPlan` for that date
- Use the target amount instead of stored amount when completed

---

### 2. **Daily Period Totals Issue** ⚠️ CRITICAL
**Location:** `progressService.ts` Line 473-492

**Problem:**
- Uses `today.getDay()` to get day of week (0-6)
- Maps to workout plan using `dayOfWeek === 0 ? 6 : dayOfWeek - 1`
- Maps to diet plan using `dayOfWeek` directly
- **Doesn't account for actual date** - if plan started on a different day, mapping is wrong
- Should find the actual day in the plan based on the date, not just day of week

**Fix Needed:**
- For daily period, find the actual day in the plan that matches today's date
- Use date matching instead of day-of-week matching

---

### 3. **Weekly/Monthly Totals Issue** ⚠️ HIGH
**Location:** `progressService.ts` Line 493-525

**Problem:**
- Weekly: Sums ALL days in `weeklyPlan` (7 days)
- Monthly: Multiplies weekly totals by weeks in month
- **Doesn't account for date range** - if a week only has 3 days in range, should only count 3 days
- Should count only days that fall within `startDate` and `endDate`

**Fix Needed:**
- Count only days within the date range
- For weekly: Count days from startDate to endDate
- For monthly: Count days from startDate to endDate

---

### 4. **Water Target for Daily** ⚠️ MEDIUM
**Location:** `progressService.ts` Line 492

**Problem:**
- Hardcoded to `targetWater = 3` for daily
- Should use the actual day's target from diet plan

**Fix Needed:**
- Get target water from the diet plan day that matches today's date

---

### 5. **Date Range Calculation for Weekly** ⚠️ MEDIUM
**Location:** `progressService.ts` Line 257-293

**Problem:**
- Weekly calculation might not align with actual calendar weeks
- Should ensure date range matches the actual week boundaries

**Fix Needed:**
- Verify date range calculation matches the actual week structure

---

## Data Sync Verification

### Current Data Sources:
1. ✅ **Completed Exercises**: From `exerciseCompletionService.getCompletionData()`
2. ✅ **Completed Meals**: From `mealCompletionService.getCompletionData()`
3. ✅ **Water Intake**: From `water_intake` and `water_completed` in storage
4. ✅ **Date Filtering**: Filters by date range correctly

### Issues with Sync:
1. ❌ **Water Intake**: Not using target amount when completed
2. ❌ **Daily Totals**: Using day-of-week instead of actual date
3. ❌ **Weekly/Monthly Totals**: Not accounting for partial weeks/months

---

## Recommended Fixes Priority

### Priority 1 (Critical - Data Accuracy):
1. Fix water intake to use target amount when completed
2. Fix daily period to use actual date matching
3. Fix weekly/monthly totals to count only days in range

### Priority 2 (Important - Better UX):
4. Fix water target to use actual day's target
5. Add better error handling for missing data

---

## Testing Checklist

After fixes, verify:
- [ ] Daily view shows correct data for today
- [ ] Weekly view shows correct data for current week
- [ ] Monthly view shows correct data for current month
- [ ] Water intake shows 100% (3L) when marked as "Done"
- [ ] Totals match actual planned workouts/meals for the period
- [ ] Completed counts match actual completions
- [ ] Data updates in real-time when meals/exercises are completed

