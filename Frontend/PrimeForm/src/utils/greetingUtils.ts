/**
 * Get time-based greeting based on current time of day
 * @param language - Language code ('en' or 'ur')
 * @returns Greeting string based on time of day
 */
export const getTimeBasedGreeting = (language: 'en' | 'ur' = 'en'): string => {
  const hour = new Date().getHours();
  
  // Define time ranges
  // Morning: 5:00 AM - 11:59 AM
  // Afternoon: 12:00 PM - 4:59 PM
  // Evening: 5:00 PM - 8:59 PM
  // Night: 9:00 PM - 4:59 AM
  
  if (language === 'ur') {
    // Urdu translations
    if (hour >= 5 && hour < 12) {
      return 'صبح بخیر'; // Good Morning
    } else if (hour >= 12 && hour < 17) {
      return 'دوپہر بخیر'; // Good Afternoon
    } else if (hour >= 17 && hour < 21) {
      return 'شام بخیر'; // Good Evening
    } else {
      return 'شب بخیر'; // Good Night
    }
  } else {
    // English translations
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  }
};

