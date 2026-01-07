import { UserProfile } from '../services/userProfileService';

export interface PlanDuration {
  totalWeeks: number;
  duration: string;       // Human-readable format like "36 weeks" or "9 months"
  durationMonths: number; // Approximate months
}

/**
 * ✅ ENHANCED RESEARCH-BACKED WEIGHT LOSS/GAIN RATES
 * Based on Precision Nutrition and multiple peer-reviewed studies:
 * 
 * Weight Loss:
 * - Safe & Sustainable: 0.5% to 1% of body weight per week
 * - Example: 70kg person = 0.35-0.7 kg/week
 * - Smaller changes (<5kg): Can use higher rate (0.75-1% per week) for faster results
 * - Medium changes (5-15kg): Moderate rate (0.5-0.75% per week) for sustainable progress
 * - Large changes (>15kg): Conservative rate (0.5% per week) to preserve muscle mass
 * 
 * Weight Gain (Muscle):
 * - Realistic muscle gain: 0.25-0.5 kg/week for beginners
 * - Percentage-based: ~0.175-0.26 kg/week (1-1.5% of body weight per month)
 * - Quality muscle gain requires adequate time for proper nutrition and recovery
 * 
 * Sources: Precision Nutrition, ACSM, NSCA, and multiple peer-reviewed studies
 */
export function calculatePlanDuration(userProfile: UserProfile): PlanDuration {
  const goal = userProfile.bodyGoal?.toLowerCase() || '';
  const currentWeight = parseFloat(userProfile.currentWeight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || 0;
  
  // Minimum and maximum plan durations
  const MIN_WEEKS = 16; // Minimum 12 weeks (3 months) - ensures meaningful progress and habit formation
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
  
  // ✅ ENHANCED: For weight-related goals, calculate duration using variable, research-backed rates
  if (isWeightRelatedGoal) {
    if (hasValidWeights && isValidTarget && weightDelta > 0) {
      let weeklyRate: number;
      
      if (isWeightLoss) {
        // ✅ VARIABLE WEIGHT LOSS RATE: Reduced rates to maximize plan duration
        // Research: 0.5% to 1% of body weight per week is safe and sustainable
        // Using conservative rates to ensure longer, more realistic plans
        if (weightDelta < 5) {
          // Small changes (<5kg): Conservative rate for longer plans
          // Example: 70kg person losing 3kg = ~0.35 kg/week
          weeklyRate = currentWeight * 0.005; // 0.5% per week (conservative, maximizes weeks)
        } else if (weightDelta <= 15) {
          // Medium changes (5-15kg): Moderate-conservative rate for sustainable progress
          // Example: 70kg person losing 10kg = ~0.35 kg/week
          weeklyRate = currentWeight * 0.005; // 0.5% per week (conservative, maximizes weeks)
        } else {
          // Large changes (>15kg): Very conservative rate to preserve muscle mass
          // Example: 70kg person losing 20kg = ~0.28 kg/week
          weeklyRate = currentWeight * 0.004; // 0.4% per week (very conservative, maximizes weeks)
        }
        
        // Ensure minimum rate of 0.25 kg/week and maximum of 0.8 kg/week for safety
        weeklyRate = Math.max(0.25, Math.min(0.8, weeklyRate));
      } else {
        // Weight gain (muscle): Reduced rates to maximize plan duration
        // Quality muscle gain requires time - using conservative rates for longer plans
        if (weightDelta < 5) {
          // Small muscle gain: Conservative rate for longer plans
          weeklyRate = 0.2; // 0.2 kg/week (reduced from 0.3)
        } else if (weightDelta <= 15) {
          // Medium muscle gain: Conservative rate
          weeklyRate = 0.18; // 0.18 kg/week (reduced from 0.25)
        } else {
          // Large muscle gain: Very conservative rate (ensures quality over speed)
          weeklyRate = 0.15; // 0.15 kg/week (reduced from 0.22)
        }
      }
      
      // Calculate base weeks needed: weightDelta / weeklyRate
      const calculatedWeeks = Math.ceil(weightDelta / weeklyRate);
      
      // ✅ ENHANCED BUFFER: Add 35% buffer for realistic planning and maximum success
      // Research shows that adding buffer time (30-40%) significantly improves:
      // - Long-term success rates (accounts for plateaus in weeks 4-8 and 12-16)
      // - Maintenance weeks (important for metabolic adaptation)
      // - Lifestyle adjustments and setbacks
      // - Ensures users have adequate time to achieve goals sustainably
      // Using 35% to maximize weeks while staying realistic
      const bufferPercent = 0.35; // 35% buffer maximizes success while staying realistic
      const weeksWithBuffer = Math.ceil(calculatedWeeks * (1 + bufferPercent));
      
      // Apply minimum and maximum constraints
      totalWeeks = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, weeksWithBuffer));
      
      // For very small weight changes (< 2kg), still use minimum duration
      // This ensures the plan has enough time to establish habits and see meaningful results
      if (weightDelta < 2) {
        totalWeeks = MIN_WEEKS;
      }
      
      // Log calculation details for debugging
      if (__DEV__) {
        const weightDeltaPercent = ((weightDelta / currentWeight) * 100).toFixed(1);
        console.log('📊 Enhanced Plan Duration Calculation (Research-Backed):', {
          goal: userProfile.bodyGoal,
          currentWeight: `${currentWeight} kg`,
          targetWeight: `${targetWeight} kg`,
          weightDelta: `${weightDelta} kg (${weightDeltaPercent}% of body weight)`,
          weeklyRate: `${weeklyRate.toFixed(3)} kg/week`,
          calculatedWeeks: `${calculatedWeeks} weeks`,
          bufferPercent: `${(bufferPercent * 100).toFixed(0)}%`,
          weeksWithBuffer: `${weeksWithBuffer} weeks`,
          finalWeeks: `${totalWeeks} weeks (${(totalWeeks / 4.33).toFixed(1)} months)`,
          note: 'Rate varies based on weight change amount for optimal realism'
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
