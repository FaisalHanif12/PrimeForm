import { UserProfile } from '../services/userProfileService';

export interface PlanDuration {
  totalWeeks: number;
  duration: string;       // Human-readable format like "36 weeks" or "9 months"
  durationMonths: number; // Approximate months
}

/**
 * ✅ RESEARCH-BACKED WEIGHT LOSS/GAIN RATES
 * Based on scientific studies and fitness industry standards:
 * 
 * Weight Loss:
 * - Safe & Sustainable: 0.5-1.0 kg/week (1-2 lbs/week)
 * - Conservative (used here): 0.5 kg/week - ensures muscle preservation and long-term success
 * - Maximum safe: 1.0 kg/week for obese individuals
 * 
 * Weight Gain (Muscle):
 * - Realistic muscle gain: 0.25-0.5 kg/week (0.5-1 lb/week)
 * - Conservative (used here): 0.25 kg/week - ensures quality muscle gain, not just fat
 * - Maximum realistic: 0.5 kg/week for beginners with perfect nutrition
 * 
 * Sources: ACSM, NSCA, and multiple peer-reviewed studies
 */
export function calculatePlanDuration(userProfile: UserProfile): PlanDuration {
  const goal = userProfile.bodyGoal?.toLowerCase() || '';
  const currentWeight = parseFloat(userProfile.currentWeight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || 0;
  
  // ✅ RESEARCH-BACKED RATES: Conservative and sustainable
  const SAFE_LOSS_RATE = 0.5; // 0.5 kg/week (~1.1 lb/week) - safe, sustainable fat loss rate
  const SAFE_GAIN_RATE = 0.25; // 0.25 kg/week (~0.55 lb/week) - realistic muscle gain rate
  
  // Minimum and maximum plan durations
  const MIN_WEEKS = 12; // Minimum 12 weeks (3 months) - ensures meaningful progress
  const MAX_WEEKS = 104; // Maximum 104 weeks (2 years) - reasonable long-term plan cap
  
  // Weight validation ranges (reasonable human weights in kg)
  const MIN_REASONABLE_WEIGHT = 30; // Minimum reasonable weight (kg)
  const MAX_REASONABLE_WEIGHT = 200; // Maximum reasonable weight (kg)
  
  // Maximum weight change allowed (50% of current weight - realistic limit)
  const MAX_WEIGHT_CHANGE_PERCENT = 0.5; // 50% of current weight
  
  let totalWeeks = 12; // Default fallback
  
  // Check if goal is weight-related
  const isWeightLoss = goal.includes('lose') || goal.includes('fat');
  const isWeightGain = goal.includes('gain') || goal.includes('muscle');
  const isWeightRelatedGoal = isWeightLoss || isWeightGain;
  
  // Validate weight data - check if weights are within reasonable ranges
  const isValidCurrentWeight = currentWeight >= MIN_REASONABLE_WEIGHT && currentWeight <= MAX_REASONABLE_WEIGHT;
  const isValidTargetWeight = targetWeight >= MIN_REASONABLE_WEIGHT && targetWeight <= MAX_REASONABLE_WEIGHT;
  const hasValidWeights = isValidCurrentWeight && isValidTargetWeight && currentWeight > 0 && targetWeight > 0;
  
  // ✅ CRITICAL VALIDATION: Check if target weight makes sense for the goal
  let weightDelta = 0;
  let isValidTarget = true;
  
  if (hasValidWeights) {
    if (isWeightLoss) {
      // For weight loss: target must be LESS than current weight
      if (targetWeight >= currentWeight) {
        isValidTarget = false;
        if (__DEV__) {
          console.warn('⚠️ Invalid target weight for weight loss:', {
            currentWeight,
            targetWeight,
            goal: userProfile.bodyGoal
          });
        }
      } else {
        weightDelta = currentWeight - targetWeight;
      }
    } else if (isWeightGain) {
      // For weight gain: target must be MORE than current weight
      if (targetWeight <= currentWeight) {
        isValidTarget = false;
        if (__DEV__) {
          console.warn('⚠️ Invalid target weight for weight gain:', {
            currentWeight,
            targetWeight,
            goal: userProfile.bodyGoal
          });
        }
      } else {
        weightDelta = targetWeight - currentWeight;
      }
    } else {
      // For other goals, calculate absolute difference
      weightDelta = Math.abs(currentWeight - targetWeight);
    }
    
    // ✅ CRITICAL VALIDATION: Weight change should not exceed 50% of current weight
    const maxAllowedChange = currentWeight * MAX_WEIGHT_CHANGE_PERCENT;
    if (weightDelta > maxAllowedChange) {
      isValidTarget = false;
      if (__DEV__) {
        console.warn('⚠️ Weight change exceeds realistic limit (50% of current weight):', {
          currentWeight,
          targetWeight,
          weightDelta,
          maxAllowedChange,
          goal: userProfile.bodyGoal
        });
      }
    }
  }
  
  // Log warning if invalid weights detected (for debugging)
  if (isWeightRelatedGoal && (!hasValidWeights || !isValidTarget)) {
    if (__DEV__) {
      console.warn('⚠️ Invalid weight data for duration calculation:', {
        currentWeight,
        targetWeight,
        isValidCurrentWeight,
        isValidTargetWeight,
        isValidTarget,
        weightDelta,
        goal: userProfile.bodyGoal
      });
    }
  }
  
  // ✅ CRITICAL: For weight-related goals (Lose Fat / Gain Muscle), calculate duration based on target weight
  if (isWeightRelatedGoal) {
    if (hasValidWeights && isValidTarget && weightDelta > 0) {
      // Calculate exact weeks needed based on weight delta and research-backed safe rate
      // Formula: weeks = weightDelta / safeRatePerWeek
      // Using Math.ceil to round up, ensuring users have enough time (conservative approach)
      const safeRate = isWeightLoss ? SAFE_LOSS_RATE : SAFE_GAIN_RATE;
      const calculatedWeeks = Math.ceil(weightDelta / safeRate);
      
      // ✅ ENHANCED: Add buffer weeks for sustainable progress
      // Research shows that adding 20-30% buffer time improves long-term success rates
      // This accounts for plateaus, maintenance weeks, and lifestyle adjustments
      const bufferPercent = 0.25; // 25% buffer for realistic planning
      const weeksWithBuffer = Math.ceil(calculatedWeeks * (1 + bufferPercent));
      
      // Apply minimum and maximum constraints
      // This ensures duration scales properly: more weight = more weeks, less weight = fewer weeks (but minimum applies)
      totalWeeks = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, weeksWithBuffer));
      
      // For very small weight changes (< 2kg), still use minimum duration
      // This ensures the plan has enough time to establish habits and see meaningful results
      if (weightDelta < 2) {
        totalWeeks = MIN_WEEKS;
      }
      
      // Log calculation details for debugging
      if (__DEV__) {
        console.log('📊 Plan duration calculation (Research-Backed):', {
          goal: userProfile.bodyGoal,
          currentWeight,
          targetWeight,
          weightDelta: `${weightDelta} kg`,
          safeRate: `${safeRate} kg/week`,
          calculatedWeeks: `${calculatedWeeks} weeks`,
          bufferPercent: `${(bufferPercent * 100).toFixed(0)}%`,
          weeksWithBuffer: `${weeksWithBuffer} weeks`,
          finalWeeks: `${totalWeeks} weeks (${(totalWeeks / 4.33).toFixed(1)} months)`
        });
      }
    } else {
      // Weight-related goal but missing/invalid target weight or invalid target
      // Use minimum duration as default
      totalWeeks = MIN_WEEKS;
      if (__DEV__) {
        console.warn('⚠️ Using default duration due to invalid weight data');
      }
    }
  } else {
    // For non-weight goals (General Training, Improve Fitness, Maintain Weight), use goal-based defaults
    if (goal.includes('fitness') || goal.includes('training') || goal.includes('endurance') || goal.includes('improve')) {
      // General fitness/training goals: 1 year (52 weeks) - long-term commitment
      totalWeeks = 52; // 1 year as per requirement
    } else if (goal.includes('maintain')) {
      // Maintenance: 3-6 months (12-24 weeks)
      totalWeeks = 16; // 4 months
    } else {
      // Default: 12 weeks (3 months) fallback
      totalWeeks = 12;
    }
  }
  
  // Calculate months (approximate - 4.33 weeks per month)
  const durationMonths = Math.round((totalWeeks / 4.33) * 10) / 10;
  
  let duration: string;
  if (totalWeeks >= 24) {
    // 24+ weeks, show as months (rounded)
    const months = Math.round(totalWeeks / 4.33);
    duration = `${months} months`;
  } else {
    // Less than 24 weeks, show as weeks
    duration = `${totalWeeks} weeks`;
  }
  
  return {
    totalWeeks,
    duration,
    durationMonths
  };
}

/**
 * Format duration for AI prompt (ensures consistent format)
 */
export function formatDurationForPrompt(planDuration: PlanDuration): string {
  return `${planDuration.totalWeeks} weeks (~${planDuration.durationMonths.toFixed(1)} months)`;
}

