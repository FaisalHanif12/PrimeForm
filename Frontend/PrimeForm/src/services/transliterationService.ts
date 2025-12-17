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
  
  // Letters (uppercase)
  
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
  // Common names - Enhanced with more natural Urdu transliterations
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
  
  // Modern names with natural Urdu feel
  'aleeza': 'علیزہ',
  'aliza': 'علیزہ',
  'alisha': 'علیشہ',
  'alina': 'علینہ',
  'amina': 'امینہ',
  'amira': 'امیرہ',
  'anaya': 'عنایہ',
  'ariana': 'اریانہ',
  'azra': 'ازرا',
  'bushra': 'بشرٰی',
  'dania': 'دانیہ',
  'eliza': 'علیزہ',
  'hania': 'ہانیہ',
  'hira': 'حرا',
  'iman': 'ایمان',
  'iqra': 'اقرا',
  'jannat': 'جنت',
  'khadija': 'خدیجہ',
  'layla': 'لیلیٰ',
  'maham': 'مہم',
  'nadia': 'نادیہ',
  'noor': 'نور',
  'rabia': 'رابعہ',
  'saba': 'صبا',
  'sadia': 'سعدیہ',
  'sana': 'ثناء',
  'sarah': 'سارہ',
  'sumaya': 'سمایا',
  'tahira': 'طاہرہ',
  'umaira': 'عمیرہ',
  'yusra': 'یسرا',
  'zahra': 'زہرا',
  'zoya': 'زویا',
  
  // Male names with natural Urdu feel
  'ahmad': 'احمد',
  'abdullah': 'عبداللہ',
  'abdul': 'عبدال',
  'adnan': 'عدنان',
  'ahsan': 'احسن',
  'amir': 'امیر',
  'anas': 'انس',
  'arham': 'ارحم',
  'asad': 'اسد',
  'ayman': 'ایمان',
  'azlan': 'ازلان',
  'danial': 'دانیال',
  'ehtesham': 'احتشام',
  'fahad': 'فہد',
  'farhan': 'فرحان',
  'ghulam': 'غلام',
  'hamza': 'حمزہ',
  'haris': 'حارث',
  'ibrahim': 'ابراہیم',
  'imran': 'عمران',
  'iqbal': 'اقبال',
  'irfan': 'عرفان',
  'ismail': 'اسماعیل',
  'junaid': 'جنید',
  'kamran': 'کامران',
  'kashif': 'کاشف',
  'khalid': 'خالد',
  'mahmood': 'محمود',
  'mohammad': 'محمد',
  'muhammad': 'محمد',
  'murtaza': 'مرتضیٰ',
  'musa': 'موسیٰ',
  'nabeel': 'نبیل',
  'nadeem': 'ندیم',
  'najam': 'نجم',
  'naseem': 'نسیم',
  'naveed': 'نوید',
  'nawaz': 'نواز',
  'noman': 'نعمان',
  'osama': 'اسامہ',
  'qasim': 'قاسم',
  'rafay': 'رفیع',
  'rafi': 'رفیع',
  'rahman': 'رحمان',
  'raza': 'رضا',
  'rizwan': 'رضوان',
  'saad': 'سعد',
  'sabir': 'صابر',
  'saeed': 'سعید',
  'saif': 'سیف',
  'sajid': 'ساجد',
  'saleem': 'سلیم',
  'salman': 'سلمان',
  'samad': 'صمد',
  'sami': 'سامی',
  'shahid': 'شاہد',
  'shahzad': 'شہزاد',
  'shoaib': 'شعیب',
  'sohaib': 'صہیب',
  'taha': 'طہٰ',
  'tahir': 'طاہر',
  'talha': 'طلحہ',
  'tariq': 'طارق',
  'waqas': 'وقاص',
  'waseem': 'وسیم',
  'yaseen': 'یٰسین',
  'yousuf': 'یوسف',
  'yusuf': 'یوسف',
  'zain': 'زین',
  'zainab': 'زینب',
  'zubair': 'زبیر',
  
  // Additional Pakistani/Indian names - Male
  'aadil': 'عادل',
  'aamir': 'عامر',
  'aashir': 'عاشر',
  'abaan': 'آبان',
  'abrar': 'ابرار',
  'adil': 'عادل',
  'afnan': 'افنان',
  'ahil': 'اہل',
  'aiman': 'ایمان',
  'ajmal': 'اجمل',
  'akbar': 'اکبر',
  'akram': 'اکرم',
  'alam': 'عالم',
  'amjad': 'امجد',
  'anwar': 'انور',
  'arif': 'عارف',
  'arshad': 'ارشاد',
  'asadullah': 'اسداللہ',
  'ashfaq': 'اشفاق',
  'ashraf': 'اشرف',
  'asif': 'عاصف',
  'aslam': 'اسلم',
  'ataullah': 'عطاءاللہ',
  'azhar': 'اظہر',
  'aziz': 'عزیز',
  'badar': 'بدر',
  'bashir': 'بشیر',
  'basit': 'باسط',
  'burhan': 'برہان',
  'chaudhry': 'چودھری',
  'dawood': 'داود',
  'dilawar': 'دلاور',
  'ehsan': 'احسان',
  'faraz': 'فراز',
  'farooq': 'فاروق',
  'fazal': 'فضل',
  'ghazi': 'غازی',
  'habib': 'حبیب',
  'hafiz': 'حافظ',
  'haji': 'حاجی',
  'hakim': 'حکیم',
  'hamid': 'حامد',
  'hanif': 'حنیف',
  'idrees': 'ادریس',
  'iftikhar': 'افتخار',
  'ijaz': 'اعجاز',
  'ikram': 'اکرام',
  'imtiaz': 'امتیاز',
  'irshad': 'ارشاد',
  'ishaq': 'اسحاق',
  'jabbar': 'جبار',
  'jaffer': 'جعفر',
  'jahan': 'جہان',
  'jameel': 'جمیل',
  'jawad': 'جواد',
  'jawed': 'جواد',
  'jibran': 'جبران',
  'kabeer': 'کبیر',
  'kaleem': 'کلیم',
  'kamal': 'کمال',
  'karim': 'کریم',
  'khalil': 'خلیل',
  'khurram': 'خرم',
  'latif': 'لطیف',
  'mahboob': 'محبوب',
  'majid': 'ماجد',
  'malik': 'مالک',
  'manzoor': 'منظور',
  'masood': 'مسعود',
  'mazhar': 'مظہر',
  'mehmood': 'محمود',
  'mian': 'میان',
  'mohsin': 'محسن',
  'momin': 'مومن',
  'mubashir': 'مبشر',
  'mudassir': 'مدثر',
  'mukhtar': 'مختار',
  'mumtaz': 'ممتاز',
  'munir': 'منیر',
  'mushtaq': 'مشتاق',
  'mustafa': 'مصطفیٰ',
  'nazir': 'نذیر',
  'noorullah': 'نوراللہ',
  'noorul': 'نورال',
  'nusrat': 'نصرت',
  'parvez': 'پرویز',
  'qaiser': 'قیصر',
  'qamar': 'قمر',
  'qazi': 'قاضی',
  'qurban': 'قربان',
  'rafiq': 'رفیق',
  'rahim': 'رحیم',
  'raja': 'راجہ',
  'rajab': 'رجب',
  'ramzan': 'رمضان',
  'rasheed': 'رشید',
  'rehan': 'ریحان',
  'sadaqat': 'صداقت',
  'sanaullah': 'ثناءاللہ',
  'sardar': 'سردار',
  'shabbir': 'شبیر',
  'shadab': 'شاداب',
  'shafiq': 'شفیق',
  'shahbaz': 'شہباز',
  'shaikh': 'شیخ',
  'shakir': 'شاکر',
  'shams': 'شمس',
  'shaukat': 'شوکت',
  'sohail': 'سہیل',
  'subhan': 'سبحان',
  'sufyan': 'سفیان',
  'sultan': 'سلطان',
  'taufeeq': 'توفیق',
  'tayyab': 'طیب',
  'ubaid': 'عبید',
  'umar': 'عمر',
  'usama': 'اسامہ',
  'waheed': 'واحد',
  'waqar': 'وقار',
  'wasiq': 'واثق',
  'zafar': 'ظفر',
  'zahid': 'زاہد',
  'zaki': 'ذکی',
  'zaman': 'زمان',
  'zulfiqar': 'ذوالفقار',
  
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
      const cleanWord = lowerWord.replace(/[^a-zA-Z]/g, '');
      
      // Check if it's a complete word mapping
      if (englishToUrduWords[cleanWord]) {
        return englishToUrduWords[cleanWord];
      }
      
      // Special handling for names - try to find close matches
      const nameMatch = this.findClosestNameMatch(cleanWord);
      if (nameMatch) {
        return nameMatch;
      }
      
      // Character-by-character transliteration with improved logic
      return this.transliterateWordWithContext(word);
    }).join(' ');
  }

  /**
   * Find closest name match for better Urdu transliteration
   */
  private findClosestNameMatch(word: string): string | null {
    // Direct matches
    if (englishToUrduWords[word]) {
      return englishToUrduWords[word];
    }
    
    // Try common name variations
    const variations = this.getNameVariations(word);
    for (const variation of variations) {
      if (englishToUrduWords[variation]) {
        return englishToUrduWords[variation];
      }
    }
    
    // Try partial matches for names
    const partialMatches = Object.keys(englishToUrduWords).filter(key => 
      key.startsWith(word.substring(0, 3)) || 
      key.endsWith(word.substring(word.length - 3)) ||
      key.includes(word.substring(1, word.length - 1))
    );
    
    if (partialMatches.length > 0) {
      // Return the closest match based on length similarity
      const closest = partialMatches.reduce((prev, curr) => 
        Math.abs(curr.length - word.length) < Math.abs(prev.length - word.length) ? curr : prev
      );
      return englishToUrduWords[closest];
    }
    
    return null;
  }

  /**
   * Generate common name variations for better matching
   */
  private getNameVariations(word: string): string[] {
    const variations = [];
    
    // Common name patterns
    if (word.endsWith('a')) {
      variations.push(word.slice(0, -1) + 'ah'); // aleeza -> aleezah
      variations.push(word.slice(0, -1) + 'a');  // aleeza -> aleeza
    }
    if (word.endsWith('h')) {
      variations.push(word.slice(0, -1) + 'a');  // aleezah -> aleeza
    }
    if (word.endsWith('n')) {
      variations.push(word.slice(0, -1) + 'an'); // adnan -> adnan
    }
    if (word.endsWith('m')) {
      variations.push(word.slice(0, -1) + 'am'); // maham -> maham
    }
    
    // Common letter substitutions
    const letterSubs = {
      'c': 'k',
      'ph': 'f',
      'z': 's',
      'q': 'k'
    };
    
    for (const [from, to] of Object.entries(letterSubs)) {
      if (word.includes(from)) {
        variations.push(word.replace(new RegExp(from, 'g'), to));
      }
    }
    
    // Handle common name prefixes and suffixes
    if (word.startsWith('al')) {
      variations.push('al' + word.slice(2)); // alisha -> alisha
      variations.push('el' + word.slice(2)); // alisha -> elisha
    }
    if (word.startsWith('el')) {
      variations.push('al' + word.slice(2)); // elisha -> alisha
    }
    if (word.startsWith('ad')) {
      variations.push('ad' + word.slice(2)); // adnan -> adnan
    }
    if (word.startsWith('am')) {
      variations.push('am' + word.slice(2)); // amina -> amina
    }
    
    // Handle common name endings
    if (word.endsWith('ia')) {
      variations.push(word.slice(0, -2) + 'iya'); // maria -> mariya
    }
    if (word.endsWith('iya')) {
      variations.push(word.slice(0, -3) + 'ia'); // mariya -> maria
    }
    if (word.endsWith('iya')) {
      variations.push(word.slice(0, -3) + 'ia'); // mariya -> maria
    }
    
    return variations;
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
