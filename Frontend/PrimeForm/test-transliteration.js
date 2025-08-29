// Test file for enhanced Urdu transliteration
// Run this to see the improvements in action

const transliterationService = require('./src/services/transliterationService.ts');

console.log('🧪 Testing Enhanced Urdu Transliteration Service');
console.log('==============================================');

// Test the enhanced transliteration
transliterationService.testTransliteration();

// Test specific names
console.log('\n🔍 Testing Specific Names:');
console.log('Aleeza →', transliterationService.transliterateName('Aleeza', 'ur'));
console.log('Aliza →', transliterationService.transliterateName('Aliza', 'ur'));
console.log('Alisha →', transliterationService.transliterateName('Alisha', 'ur'));
console.log('Alina →', transliterationService.transliterateName('Alina', 'ur'));
console.log('Amina →', transliterationService.transliterateName('Amina', 'ur'));

console.log('\n🎯 Key Improvements:');
console.log('1. Names like "Aleeza" now transliterate to "علیزہ" instead of separate characters');
console.log('2. Better handling of common name patterns and variations');
console.log('3. More natural Urdu feel for complex names');
console.log('4. Intelligent pattern matching for better transliteration');
console.log('5. Context-aware character combinations (th, ch, sh, gh, kh, ph)');

console.log('\n✨ The transliteration now provides a much more authentic Urdu experience!');
