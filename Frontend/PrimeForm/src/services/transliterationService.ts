/**
 * Transliteration Service for Pure Body
 * Handles dynamic content translation between English and Urdu
 * using character-by-character mapping
 */

// English to Urdu character mapping
const englishToUrduMapping: Record<string, string> = {
  // Letters (lowercase)
  'a': 'ا', 'b': 'ب', 'c': 'س', 'd': 'د', 'e': 'ے', 
  'f': 'ف', 'g': 'گ', 'h': 'ہ', 'i': 'ی', 'j': 'ج',
  'k': 'ک', 'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و',
  'p': 'پ', 'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت',
  'u': 'ؤ', 'v': 'و', 'w': 'و', 'x': 'ایکس', 'y': 'ی', 'z': 'ز',
  
  // Letters (uppercase) - same mapping as lowercase
  'A': 'ا', 'B': 'ب', 'C': 'س', 'D': 'د', 'E': 'ے',
  'F': 'ف', 'G': 'گ', 'H': 'ہ', 'I': 'ی', 'J': 'ج',
  'K': 'ک', 'L': 'ل', 'M': 'م', 'N': 'ن', 'O': 'و',
  'P': 'پ', 'Q': 'ق', 'R': 'ر', 'S': 'س', 'T': 'ت',
  'U': 'ؤ', 'V': 'و', 'W': 'و', 'X': 'ایکس', 'Y': 'ی', 'Z': 'ز',
  
  // Numbers
  '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
  '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
  
  // Punctuation
  '.': '۔', ',': '،', '?': '؟', '!': '!', 
  ':': ':', ';': '؛', '"': '"', "'": "'",
  '(': ')', ')': '(', '[': ']', ']': '[',
  '{': '}', '}': '{',
  
  // Special characters
  ' ': ' ', // Space remains the same
  '-': '-', '_': '_', '@': '@', '#': '#',
  '$': '$', '%': '%', '&': '&', '*': '*',
  '+': '+', '=': '=', '|': '|', '\\': '\\',
  '/': '/', '<': '>', '>': '<',
};

// Urdu to English character mapping (reverse of above)
const urduToEnglishMapping: Record<string, string> = {};

// Build reverse mapping
Object.entries(englishToUrduMapping).forEach(([english, urdu]) => {
  // Only map if it's not a duplicate value
  if (!urduToEnglishMapping[urdu]) {
    urduToEnglishMapping[urdu] = english;
  }
});

// Empty word mappings - using character-by-character transliteration only
const englishToUrduWords: Record<string, string> = {};

// Reverse word mapping
const urduToEnglishWords: Record<string, string> = {};

class TransliterationService {
  /**
   * Transliterates text from English to Urdu using character-by-character mapping
   */
  private transliterateEnglishToUrdu(text: string): string {
    const words = text.split(' ');
    
    return words.map(word => {
      // Use character-by-character transliteration directly
      return this.transliterateWordWithContext(word);
    }).join(' ');
  }

  /**
   * Enhanced word transliteration with context awareness
   */
  private transliterateWordWithContext(word: string): string {
    // Handle common English patterns that have better Urdu equivalents
    const commonPatterns = {
      'tion': 'شن',
      'sion': 'ژن',
      'ing': 'نگ',
      'ed': 'ڈ',
      'er': 'ر',
      'est': 'ست',
      'ly': 'لی',
      'ful': 'فل',
      'less': 'لس',
      'ness': 'نس',
      'ment': 'منٹ',
      'able': 'ایبل',
      'ible': 'ایبل',
      'ous': 'س',
      'al': 'ل',
      'ic': 'ک',
      'ive': 'و',
      'ize': 'ائز',
      'ise': 'ائز',
      'ify': 'ائے',
      'fy': 'ائے'
    };
    
    let result = word;
    
    // Apply common pattern replacements
    for (const [pattern, urdu] of Object.entries(commonPatterns)) {
      if (result.toLowerCase().endsWith(pattern)) {
        const beforePattern = result.slice(0, -pattern.length);
        result = beforePattern + urdu;
        break;
      }
    }
    
    // Character-by-character transliteration with improved logic
    return result.split('').map((char, index, array) => {
      const nextChar = array[index + 1];
      const prevChar = array[index - 1];
      
      // Handle common letter combinations for better Urdu feel
      if (char.toLowerCase() === 'a' && nextChar && nextChar.toLowerCase() === 'a') {
        return 'آ'; // Double 'a' becomes 'آ'
      }
      if (char.toLowerCase() === 'e' && nextChar && nextChar.toLowerCase() === 'e') {
        return 'ی'; // Double 'e' becomes 'ی'
      }
      if (char.toLowerCase() === 'o' && nextChar && nextChar.toLowerCase() === 'o') {
        return 'و'; // Double 'o' becomes 'و'
      }
      if (char.toLowerCase() === 'i' && nextChar && nextChar.toLowerCase() === 'i') {
        return 'ی'; // Double 'i' becomes 'ی'
      }
      
      // Handle 'th' combination
      if (char.toLowerCase() === 't' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'تھ';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 't') {
        return ''; // Skip 'h' after 't' as it's handled above
      }
      
      // Handle 'ch' combination
      if (char.toLowerCase() === 'c' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'چ';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 'c') {
        return ''; // Skip 'h' after 'c' as it's handled above
      }
      
      // Handle 'sh' combination
      if (char.toLowerCase() === 's' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'ش';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 's') {
        return ''; // Skip 'h' after 's' as it's handled above
      }
      
      // Handle 'gh' combination
      if (char.toLowerCase() === 'g' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'غ';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 'g') {
        return ''; // Skip 'h' after 'g' as it's handled above
      }
      
      // Handle 'kh' combination
      if (char.toLowerCase() === 'k' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'خ';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 'k') {
        return ''; // Skip 'h' after 'k' as it's handled above
      }
      
      // Handle 'ph' combination
      if (char.toLowerCase() === 'p' && nextChar && nextChar.toLowerCase() === 'h') {
        return 'ف';
      }
      if (char.toLowerCase() === 'h' && prevChar && prevChar.toLowerCase() === 'p') {
        return ''; // Skip 'h' after 'p' as it's handled above
      }
      
      // Default character mapping
      return englishToUrduMapping[char] || char;
    }).join('');
  }

  /**
   * Transliterates text from Urdu to English using reverse character mapping
   */
  private transliterateUrduToEnglish(text: string): string {
    const words = text.split(' ');
    
    return words.map(word => {
      // Check if it's a complete word mapping
      if (urduToEnglishWords[word]) {
        return urduToEnglishWords[word];
      }
      
      // Character-by-character transliteration
      return word.split('').map(char => {
        return urduToEnglishMapping[char] || char;
      }).join('');
    }).join(' ');
  }

  /**
   * Detects if text contains Urdu characters
   */
  private containsUrduText(text: string): boolean {
    const urduRange = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return urduRange.test(text);
  }

  /**
   * Detects if text contains English characters
   */
  private containsEnglishText(text: string): boolean {
    const englishRange = /[a-zA-Z]/;
    return englishRange.test(text);
  }

  /**
   * Main transliteration function - handles bidirectional conversion
   */
  public transliterateText(text: string, targetLanguage: 'en' | 'ur'): string {
    // Handle non-string values (numbers, null, undefined)
    if (text === null || text === undefined) {
      return '';
    }
    
    // Convert to string if it's not already
    const textStr = String(text);
    
    if (!textStr || textStr.trim() === '') {
      return textStr;
    }

    if (targetLanguage === 'ur') {
      // Convert to Urdu
      if (this.containsEnglishText(textStr)) {
        return this.transliterateEnglishToUrdu(textStr);
      }
      // Already in Urdu or mixed, return as is
      return textStr;
    } else {
      // Convert to English
      if (this.containsUrduText(textStr)) {
        return this.transliterateUrduToEnglish(textStr);
      }
      // Already in English or mixed, return as is
      return textStr;
    }
  }

  /**
   * Transliterates user names specifically
   */
  public transliterateName(name: string, targetLanguage: 'en' | 'ur'): string {
    return this.transliterateText(name, targetLanguage);
  }

  /**
   * Transliterates numbers from English to Urdu numerals
   */
  public transliterateNumbers(text: string | number | null | undefined, targetLanguage: 'en' | 'ur'): string {
    // Handle null, undefined, or empty values
    if (text === null || text === undefined) {
      return '';
    }
    
    // Convert to string if it's a number
    const textStr = String(text);
    
    if (!textStr || textStr.trim() === '') {
      return textStr;
    }
    
    if (targetLanguage === 'ur') {
      return textStr.replace(/[0-9]/g, (match) => englishToUrduMapping[match] || match);
    } else {
      return textStr.replace(/[۰-۹]/g, (match) => urduToEnglishMapping[match] || match);
    }
  }

  /**
   * Get all available word mappings for debugging
   */
  public getWordMappings(): { english: Record<string, string>, urdu: Record<string, string> } {
    return {
      english: englishToUrduWords,
      urdu: urduToEnglishWords
    };
  }

  /**
   * Add custom word mapping
   */
  public addWordMapping(english: string, urdu: string): void {
    englishToUrduWords[english.toLowerCase()] = urdu;
    urduToEnglishWords[urdu] = english.toLowerCase();
  }

  /**
   * Test transliteration with examples
   */
  public testTransliteration(): void {
    const testNames = [
      'Aleeza',
      'Aliza', 
      'Alisha',
      'Alina',
      'Amina',
      'Amira',
      'Anaya',
      'Ariana',
      'Azra',
      'Bushra',
      'Dania',
      'Eliza',
      'Hania',
      'Hira',
      'Iman',
      'Iqra',
      'Jannat',
      'Khadija',
      'Layla',
      'Maham',
      'Nadia',
      'Noor',
      'Rabia',
      'Saba',
      'Sadia',
      'Sana',
      'Sarah',
      'Sumaya',
      'Tahira',
      'Umaira',
      'Yusra',
      'Zahra',
      'Zoya'
    ];

    console.log('🧪 Testing Enhanced Urdu Transliteration:');
    console.log('=====================================');
    
    testNames.forEach(name => {
      const urdu = this.transliterateName(name, 'ur');
      console.log(`${name.padEnd(12)} → ${urdu}`);
    });
    
    console.log('=====================================');
    console.log('✅ Enhanced transliteration provides more natural Urdu feel!');
  }
}

export default new TransliterationService();
