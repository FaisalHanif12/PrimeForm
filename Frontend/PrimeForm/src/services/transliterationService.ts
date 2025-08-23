/**
 * Transliteration Service for PrimeForm
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
  
  // Letters (uppercase)
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

// Enhanced word mappings for common terms
const englishToUrduWords: Record<string, string> = {
  // Common names
  'faisal': 'فیصل',
  'ahmed': 'احمد',
  'ali': 'علی',
  'hassan': 'حسن',
  'hussain': 'حسین',
  'fatima': 'فاطمہ',
  'aisha': 'عائشہ',
  'sara': 'سارہ',
  'zara': 'زارہ',
  'omar': 'عمر',
  'usman': 'عثمان',
  'bilal': 'بلال',
  'maryam': 'مریم',
  
  // Common foods
  'chicken': 'چکن',
  'rice': 'چاول',
  'bread': 'روٹی',
  'milk': 'دودھ',
  'tea': 'چائے',
  'coffee': 'کافی',
  'water': 'پانی',
  'apple': 'سیب',
  'banana': 'کیلا',
  'orange': 'مالٹا',
  'egg': 'انڈا',
  'fish': 'مچھلی',
  'meat': 'گوشت',
  
  // Common exercises
  'pushups': 'پش اپس',
  'running': 'دوڑنا',
  'walking': 'چلنا',
  'swimming': 'تیراکی',
  'cycling': 'سائیکلنگ',
  'yoga': 'یوگا',
  'gym': 'جم',
  'workout': 'ورکاؤٹ',
  
  // Common words
  'home': 'گھر',
  'work': 'کام',
  'family': 'خاندان',
  'friend': 'دوست',
  'school': 'سکول',
  'university': 'یونیورسٹی',
  'hospital': 'ہسپتال',
  'doctor': 'ڈاکٹر',
  'teacher': 'استاد',
  'student': 'طالب علم',
  'book': 'کتاب',
  'phone': 'فون',
  'computer': 'کمپیوٹر',
  'car': 'گاڑی',
  'house': 'گھر',
  'office': 'دفتر',
  
  // Groceries and common items
  'groceries': 'گروسری',
  'shopping': 'خریداری',
  'market': 'بازار',
  'store': 'دکان',
  'restaurant': 'ریسٹورنٹ',
  'hotel': 'ہوٹل',
  'park': 'پارک',
  'beach': 'بیچ',
  'mountain': 'پہاڑ',
  'river': 'دریا',
};

// Reverse word mapping
const urduToEnglishWords: Record<string, string> = {};
Object.entries(englishToUrduWords).forEach(([english, urdu]) => {
  urduToEnglishWords[urdu] = english;
});

class TransliterationService {
  /**
   * Transliterates text from English to Urdu using character mapping
   */
  private transliterateEnglishToUrdu(text: string): string {
    const words = text.split(' ');
    
    return words.map(word => {
      const lowerWord = word.toLowerCase();
      
      // Check if it's a complete word mapping
      if (englishToUrduWords[lowerWord]) {
        return englishToUrduWords[lowerWord];
      }
      
      // Character-by-character transliteration
      return word.split('').map(char => {
        return englishToUrduMapping[char] || char;
      }).join('');
    }).join(' ');
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
    if (!text || text.trim() === '') {
      return text;
    }

    if (targetLanguage === 'ur') {
      // Convert to Urdu
      if (this.containsEnglishText(text)) {
        return this.transliterateEnglishToUrdu(text);
      }
      // Already in Urdu or mixed, return as is
      return text;
    } else {
      // Convert to English
      if (this.containsUrduText(text)) {
        return this.transliterateUrduToEnglish(text);
      }
      // Already in English or mixed, return as is
      return text;
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
  public transliterateNumbers(text: string, targetLanguage: 'en' | 'ur'): string {
    if (targetLanguage === 'ur') {
      return text.replace(/[0-9]/g, (match) => englishToUrduMapping[match] || match);
    } else {
      return text.replace(/[۰-۹]/g, (match) => urduToEnglishMapping[match] || match);
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
}

export default new TransliterationService();
