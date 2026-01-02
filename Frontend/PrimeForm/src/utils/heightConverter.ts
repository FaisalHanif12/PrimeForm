/**
 * Height conversion utility
 * Handles both cm and inches input formats
 * Normalizes height to cm for calculations and displays both formats in prompts
 */

/**
 * Parse height input and convert to cm
 * Supports formats:
 * - "175" (assumed cm)
 * - "175 cm" or "175cm"
 * - "5'8" or "5'8\"" (feet and inches)
 * - "68" (assumed inches if > 50)
 * - "68 inches" or "68in"
 * 
 * @param heightInput - Height string from user input
 * @returns Height in cm (number)
 */
export function parseHeightToCm(heightInput: string): number {
  if (!heightInput || typeof heightInput !== 'string') {
    return 0;
  }

  const trimmed = heightInput.trim().toLowerCase();

  // Check for feet and inches format: 5'8, 5'8", 5' 8", etc.
  const feetInchesMatch = trimmed.match(/(\d+)[\s']*(\d+)?[\s"]*/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1]);
    const inches = feetInchesMatch[2] ? parseInt(feetInchesMatch[2]) : 0;
    
    // If first number is reasonable for feet (4-8) and second is reasonable for inches (0-11)
    if (feet >= 4 && feet <= 8 && inches >= 0 && inches <= 11) {
      const totalInches = (feet * 12) + inches;
      return Math.round(totalInches * 2.54); // Convert inches to cm
    }
  }

  // Extract numeric value
  const numericMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!numericMatch) {
    return 0;
  }

  const numericValue = parseFloat(numericMatch[1]);

  // Check if it's inches (if value > 50, likely inches for adults)
  if (trimmed.includes('inch') || trimmed.includes('in') || trimmed.includes("''") || trimmed.includes('"')) {
    return Math.round(numericValue * 2.54); // Convert inches to cm
  }

  // Check if it's cm
  if (trimmed.includes('cm')) {
    return Math.round(numericValue);
  }

  // Heuristic: if value > 50, assume inches; otherwise assume cm
  // This handles cases like "68" (likely 68 inches = 5'8") vs "175" (likely 175 cm)
  if (numericValue > 50 && numericValue < 100) {
    // Could be inches (adult height range: 50-90 inches)
    // But also could be cm if user is very tall
    // Check if it's a common cm value (> 150) or inches value (< 100)
    if (numericValue < 100) {
      // More likely inches
      return Math.round(numericValue * 2.54);
    }
  }

  // Default: assume cm
  return Math.round(numericValue);
}

/**
 * Convert cm to feet and inches format
 * @param cm - Height in centimeters
 * @returns Object with feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Format height for display in prompts
 * Shows both cm and feet/inches if original was in inches
 * @param heightInput - Original height input string
 * @param heightCm - Height in cm (calculated)
 * @returns Formatted string for AI prompt
 */
export function formatHeightForPrompt(heightInput: string, heightCm: number): string {
  if (!heightInput || !heightCm) {
    return `${heightCm} cm`;
  }

  const trimmed = heightInput.trim().toLowerCase();
  
  // Check if original input was in inches format
  const wasInches = trimmed.includes('inch') || 
                    trimmed.includes('in') || 
                    trimmed.includes("''") || 
                    trimmed.includes('"') ||
                    /^\d+['"]/.test(trimmed) ||
                    (trimmed.match(/(\d+)/) && parseFloat(trimmed.match(/(\d+)/)?.[1] || '0') < 100 && parseFloat(trimmed.match(/(\d+)/)?.[1] || '0') > 50);

  if (wasInches) {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${heightCm} cm (${feet}'${inches}")`;
  }

  // Original was in cm, just show cm
  return `${heightCm} cm`;
}

/**
 * Get height in cm for calculations
 * @param heightInput - Height string from user profile
 * @returns Height in cm (number)
 */
export function getHeightInCm(heightInput: string): number {
  return parseHeightToCm(heightInput);
}

