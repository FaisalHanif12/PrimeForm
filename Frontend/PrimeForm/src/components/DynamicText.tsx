import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface DynamicTextProps {
  text: string;
  type?: 'text' | 'name' | 'number';
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

/**
 * DynamicText Component
 * Automatically transliterates user-generated content based on current language
 */
export default function DynamicText({ 
  text, 
  type = 'text', 
  style, 
  children 
}: DynamicTextProps) {
  const { transliterateText, transliterateName, transliterateNumbers } = useLanguage();

  const getTransliteratedText = (): string => {
    switch (type) {
      case 'name':
        return transliterateName(text);
      case 'number':
        return transliterateNumbers(text);
      case 'text':
      default:
        return transliterateText(text);
    }
  };

  return (
    <Text style={style}>
      {getTransliteratedText()}
      {children}
    </Text>
  );
}
