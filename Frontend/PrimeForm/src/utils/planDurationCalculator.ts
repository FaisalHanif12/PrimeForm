import { UserProfile } from '../services/userProfileService';


export interface PlanDuration {
  totalWeeks: number;
  duration: string; // Human-readable format like "36 weeks" or "9 months"
  durationMonths: number; // Approximate months
}


/**
 * Validate target weight based on current weight and goal
 * Returns validation result with error message if invalid
 */
export function validateTargetWeight(
  currentWeight: number,
  targetWeight: number,
  bodyGoal: string
): { isValid: boolean; error?: string } {
  if (!currentWeight || !targetWeight || currentWeight <= 0 || targetWeight <= 0) {
    return { isValid: false, error: 'Invalid weight values' };
  }

  const goal = bodyGoal?.toLowerCase() || '';
  const isWeightLoss = goal.includes('lose') || goal.includes('fat');
  const isWeightGain = goal.includes('gain') || goal.includes('muscle');

  // For weight loss: target must be less than current
  if (isWeightLoss && targetWeight >= currentWeight) {
    return {
      isValid: false,
      error: 'Target weight must be less than current weight for weight loss goals'
    };
  }

  // For weight gain: target must be greater than current
  if (isWeightGain && targetWeight <= currentWeight) {
    return {
      isValid: false,
      error: 'Target weight must be greater than current weight for muscle gain goals'
    };
  }

  // Calculate weight delta
  const weightDelta = Math.abs(currentWeight - targetWeight);
  const maxAllowedDelta = currentWeight * 0.5; // Maximum 50% of current weight

  // Validate that target weight is not more than 50% away from current weight
  if (weightDelta > maxAllowedDelta) {
    return {
      isValid: false,
      error: `Target weight cannot be more than ${Math.round(maxAllowedDelta)}kg away from current weight (maximum 50% change)`
    };
  }

  return { isValid: true };
}

export function calculatePlanDuration(userProfile: UserProfile): PlanDuration {
  const goal = userProfile.bodyGoal?.toLowerCase() || '';
  const currentWeight = parseFloat(userProfile.currentWeight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || 0;
  
  // ✅ REALISTIC weight change rates based on scientific research:
  // - Weight Loss: 0.5-1 kg/week is safe, but 0.5-0.75 kg/week is more sustainable long-term
  // - Muscle Gain: 0.2-0.5 kg/week naturally, but 0.25-0.4 kg/week is realistic for most people
  // Using progressive rates: faster for larger weight changes, slower for smaller changes
  const BASE_LOSS_RATE = 0.6; // 0.6 kg/week base rate (realistic and sustainable)
  const BASE_GAIN_RATE = 0.3; // 0.3 kg/week base rate (realistic natural muscle gain)
  
  // Progressive rates: larger weight changes can sustain slightly faster rates initially
  // but we'll use conservative base rates for safety
  const MIN_LOSS_RATE = 0.5; // Minimum 0.5 kg/week (very conservative)
  const MAX_LOSS_RATE = 0.75; // Maximum 0.75 kg/week (sustainable for most)
  const MIN_GAIN_RATE = 0.25; // Minimum 0.25 kg/week (very conservative)
  const MAX_GAIN_RATE = 0.4; // Maximum 0.4 kg/week (realistic natural limit)
  
  // Minimum and maximum plan durations
  const MIN_WEEKS = 12; // Minimum 12 weeks (3 months) - ensures meaningful progress
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
  
  // ✅ CRITICAL: Validate target weight logic
  if (hasValidWeights && isWeightRelatedGoal) {
    const validation = validateTargetWeight(currentWeight, targetWeight, userProfile.bodyGoal);
    if (!validation.isValid) {
      if (__DEV__) {
        console.warn('⚠️ Invalid target weight:', validation.error);
      }
      // Use minimum duration if validation fails (will be caught by frontend validation)
      return {
        totalWeeks: MIN_WEEKS,
        duration: `${MIN_WEEKS} weeks`,
        durationMonths: Math.round((MIN_WEEKS / 4.33) * 10) / 10
      };
    }
  }
  
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
  
  // ✅ CRITICAL: For weight-related goals (Lose Fat / Gain Muscle), calculate duration based on target weight
  if (isWeightRelatedGoal) {
    if (hasValidWeights && weightDelta > 0) {
      // ✅ REALISTIC CALCULATION: Use progressive rates based on weight delta
      // Larger weight changes can sustain slightly faster rates, but we'll use base rates for safety
      let weeklyRate: number;
      
      if (isWeightLoss) {
        // Weight Loss: Use base rate of 0.6 kg/week (realistic and sustainable)
        // For very large weight changes (>15kg), use slightly faster rate (0.7 kg/week)
        // For small changes (<5kg), use slightly slower rate (0.5 kg/week)
        if (weightDelta > 15) {
          weeklyRate = 0.7; // Slightly faster for large changes
        } else if (weightDelta < 5) {
          weeklyRate = 0.5; // More conservative for small changes
        } else {
          weeklyRate = BASE_LOSS_RATE; // 0.6 kg/week (optimal balance)
        }
      } else {
        // Muscle Gain: Use base rate of 0.3 kg/week (realistic natural muscle gain)
        // For larger gains (>10kg), use slightly faster rate (0.35 kg/week)
        // For smaller gains (<5kg), use slightly slower rate (0.25 kg/week)
        if (weightDelta > 10) {
          weeklyRate = 0.35; // Slightly faster for large changes
        } else if (weightDelta < 5) {
          weeklyRate = 0.25; // More conservative for small changes
        } else {
          weeklyRate = BASE_GAIN_RATE; // 0.3 kg/week (optimal balance)
        }
      }
      
      // Calculate exact weeks needed: weeks = weightDelta / weeklyRate
      // Using Math.ceil to round up, ensuring users have enough time
      const calculatedWeeks = Math.ceil(weightDelta / weeklyRate);
      
      // Apply minimum and maximum constraints
      // This ensures duration scales properly: more weight = more weeks, less weight = fewer weeks
      totalWeeks = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, calculatedWeeks));
      
      // For very small weight changes (< 2kg), still use minimum duration
      // This ensures the plan has enough time to establish habits and see meaningful results
      if (weightDelta < 2) {
        totalWeeks = MIN_WEEKS;
      }
      
      // Log calculation details for debugging
      if (__DEV__) {
        console.log('📊 Plan duration calculation (REALISTIC):', {
          goal: userProfile.bodyGoal,
          currentWeight: `${currentWeight} kg`,
          targetWeight: `${targetWeight} kg`,
          weightDelta: `${weightDelta} kg`,
          weeklyRate: `${weeklyRate} kg/week`,
          calculatedWeeks,
          finalWeeks: totalWeeks,
          duration: `${Math.round(totalWeeks / 4.33)} months`
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

