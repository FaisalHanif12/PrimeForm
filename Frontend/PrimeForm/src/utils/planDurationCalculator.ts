import { UserProfile } from '../services/userProfileService';

/**
 * Calculates optimal plan duration based on user profile
 * Ensures both diet and workout plans have the same duration
 */
export interface PlanDuration {
  totalWeeks: number;
  duration: string; // Human-readable format like "36 weeks" or "9 months"
  durationMonths: number; // Approximate months
}

/**
 * Calculate plan duration based on user profile
 * Uses safe weight loss/gain rates and ensures realistic timeframes
 */
export function calculatePlanDuration(userProfile: UserProfile): PlanDuration {
  const goal = userProfile.bodyGoal?.toLowerCase() || '';
  const currentWeight = parseFloat(userProfile.currentWeight) || 0;
  const targetWeight = parseFloat(userProfile.targetWeight) || 0;
  
  // Safe weight change rates (per week)
  const SAFE_LOSS_RATE = 0.5; // 0.5 kg/week (1 lb/week) - safe and sustainable
  const SAFE_GAIN_RATE = 0.3; // 0.3 kg/week (0.66 lb/week) - safe muscle gain rate
  
  // Minimum and maximum plan durations
  const MIN_WEEKS = 12; // Minimum 12 weeks (3 months) - ensures meaningful progress
  const MAX_WEEKS = 52; // Maximum 52 weeks (1 year) - reasonable long-term plan
  
  let totalWeeks = 12; // Default fallback
  
  // Check if goal is weight-related and we have valid weight data
  const isWeightLoss = goal.includes('lose') || goal.includes('fat');
  const isWeightGain = goal.includes('gain') || goal.includes('muscle');
  const hasValidWeights = currentWeight > 0 && targetWeight > 0;
  const weightDelta = Math.abs(currentWeight - targetWeight);
  
  if ((isWeightLoss || isWeightGain) && hasValidWeights && weightDelta > 0) {
    // Calculate weeks needed based on weight delta and safe rate
    const safeRate = isWeightLoss ? SAFE_LOSS_RATE : SAFE_GAIN_RATE;
    const calculatedWeeks = Math.ceil(weightDelta / safeRate);
    
    // Apply minimum and maximum constraints
    totalWeeks = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, calculatedWeeks));
    
    // For very small weight changes (< 2kg), still use minimum duration
    // This ensures the plan has enough time to establish habits
    if (weightDelta < 2) {
      totalWeeks = MIN_WEEKS;
    }
  } else {
    // For non-weight goals or missing weight data, use goal-based defaults
    if (goal.includes('fitness') || goal.includes('training') || goal.includes('endurance')) {
      // General fitness/training goals: 1 year (52 weeks)
      totalWeeks = 52; // 1 year as per requirement
    } else if (goal.includes('maintain')) {
      // Maintenance: 3-6 months (12-24 weeks)
      totalWeeks = 16; // 4 months
    } else {
      // Default: 12 weeks (3 months) minimum
      totalWeeks = MIN_WEEKS;
    }
  }
  
  // Calculate months (approximate - 4.33 weeks per month)
  const durationMonths = Math.round((totalWeeks / 4.33) * 10) / 10;
  
  // Generate human-readable duration string
  // Format: Show as months for 24+ weeks, weeks for less (matches workout plan display)
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

