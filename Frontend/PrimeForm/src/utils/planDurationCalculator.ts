import { UserProfile } from '../services/userProfileService';


export interface PlanDuration {
  totalWeeks: number;
  duration: string; // Human-readable format like "36 weeks" or "9 months"
  durationMonths: number; // Approximate months
}


export function calculatePlanDuration(userProfile: UserProfile): PlanDuration {
  const goal = userProfile.bodyGoal?.toLowerCase() || '';
  const currentWeight = parseFloat(userProfile.currentWeight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || 0;
  
  // Conservative safe weight change rates (per week) - lower rate = longer duration = more time to achieve goal
  // Using minimum sustainable rates to ensure users have adequate time to reach their target
  const SAFE_LOSS_RATE = 0.3; // 0.3 kg/week (~0.66 lb/week) - conservative sustainable fat loss rate
  const SAFE_GAIN_RATE = 0.2; // 0.2 kg/week (~0.44 lb/week) - conservative sustainable muscle gain rate
  
  // Minimum and maximum plan durations
  const MIN_WEEKS = 16; // Minimum 16 weeks (4 months) - ensures meaningful progress and habit formation
  const MAX_WEEKS = 52; // Maximum 52 weeks (1 year) - reasonable long-term plan cap
  
  // Weight validation ranges (reasonable human weights in kg)
  const MIN_REASONABLE_WEIGHT = 30; // Minimum reasonable weight (kg)
  const MAX_REASONABLE_WEIGHT = 200; // Maximum reasonable weight (kg)
  
  let totalWeeks = 12; // Default fallback
  
  // Check if goal is weight-related
  const isWeightLoss = goal.includes('lose') || goal.includes('fat');
  const isWeightGain = goal.includes('gain') || goal.includes('muscle');
  const isWeightRelatedGoal = isWeightLoss || isWeightGain;
  
  // Validate weight data - check if weights are within reasonable ranges
  const isValidCurrentWeight = currentWeight >= MIN_REASONABLE_WEIGHT && currentWeight <= MAX_REASONABLE_WEIGHT;
  const isValidTargetWeight = targetWeight >= MIN_REASONABLE_WEIGHT && targetWeight <= MAX_REASONABLE_WEIGHT;
  const hasValidWeights = isValidCurrentWeight && isValidTargetWeight && currentWeight > 0 && targetWeight > 0;
  
  // Calculate weight delta only if weights are valid
  const weightDelta = hasValidWeights ? Math.abs(currentWeight - targetWeight) : 0;
  
  // Log warning if invalid weights detected (for debugging)
  if (isWeightRelatedGoal && !hasValidWeights) {
    if (__DEV__) {
      console.warn('⚠️ Invalid weight data for duration calculation:', {
        currentWeight,
        targetWeight,
        isValidCurrentWeight,
        isValidTargetWeight,
        goal: userProfile.bodyGoal
      });
    }
  }
  
  // CRITICAL: For weight-related goals (Lose Fat / Gain Muscle), calculate duration based on target weight
  if (isWeightRelatedGoal) {
    if (hasValidWeights && weightDelta > 0) {
      // Calculate exact weeks needed based on weight delta and conservative safe rate
      // Formula: weeks = weightDelta / safeRatePerWeek
      // Using Math.ceil to round up, ensuring users have enough time (conservative approach)
      const safeRate = isWeightLoss ? SAFE_LOSS_RATE : SAFE_GAIN_RATE;
      const calculatedWeeks = Math.ceil(weightDelta / safeRate);
      
      // Apply minimum and maximum constraints
      // This ensures duration scales properly: more weight = more weeks, less weight = fewer weeks (but minimum applies)
      totalWeeks = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, calculatedWeeks));
      
      // For very small weight changes (< 2kg), still use minimum duration
      // This ensures the plan has enough time to establish habits and see meaningful results
      if (weightDelta < 2) {
        totalWeeks = MIN_WEEKS;
      }
      
      // Log calculation details for debugging
      if (__DEV__) {
        console.log('📊 Plan duration calculation:', {
          goal: userProfile.bodyGoal,
          currentWeight,
          targetWeight,
          weightDelta,
          safeRate: `${safeRate} kg/week`,
          calculatedWeeks,
          finalWeeks: totalWeeks
        });
      }
    } else {
      // Weight-related goal but missing/invalid target weight
      // Use minimum duration as default
      totalWeeks = MIN_WEEKS;
    }
  } else {
    // For non-weight goals (General Training, Improve Fitness, Maintain Weight), use goal-based defaults
    if (goal.includes('fitness') || goal.includes('training') || goal.includes('endurance') || goal.includes('improve')) {
      // General fitness/training goals: 1 year (52 weeks)
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

