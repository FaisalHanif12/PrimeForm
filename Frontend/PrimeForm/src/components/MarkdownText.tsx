import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/colors';

interface MarkdownTextProps {
  text: string;
  style?: any;
  textStyle?: any;
}

/**
 * MarkdownText Component
 * Renders markdown-formatted text in React Native
 * Supports: **bold**, *italic*, headings (# ## ###), numbered/bullet lists
 */
export default function MarkdownText({ text, style, textStyle }: MarkdownTextProps) {
  const parseMarkdown = (content: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Split by lines to handle headings and lists
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Empty line - add spacing
      if (!trimmedLine) {
        parts.push(
          <View key={`spacing-${lineIndex}`} style={{ height: spacing.xs }} />
        );
        return;
      }
      
      // Heading detection (# ## ###)
      const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
        parts.push(
          <Text key={`heading-${lineIndex}`} style={[headingStyle, textStyle]}>
            {parseInlineMarkdown(headingText)}
            {'\n'}
          </Text>
        );
        return;
      }
      
      // Numbered list (1. 2. etc.)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedListMatch) {
        const itemText = numberedListMatch[2];
        parts.push(
          <View key={`numbered-${lineIndex}`} style={styles.listItem}>
            <Text style={[styles.listBullet, textStyle]}>{numberedListMatch[1]}.</Text>
            <Text style={[styles.listText, textStyle]}>{parseInlineMarkdown(itemText)}</Text>
          </View>
        );
        return;
      }
      
      // Bullet list (- or *)
      const bulletListMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
      if (bulletListMatch) {
        const itemText = bulletListMatch[1];
        parts.push(
          <View key={`bullet-${lineIndex}`} style={styles.listItem}>
            <Text style={[styles.listBullet, textStyle]}>•</Text>
            <Text style={[styles.listText, textStyle]}>{parseInlineMarkdown(itemText)}</Text>
          </View>
        );
        return;
      }
      
      // Regular paragraph
      parts.push(
        <Text key={`para-${lineIndex}`} style={[styles.paragraph, textStyle]}>
          {parseInlineMarkdown(trimmedLine)}
        </Text>
      );
    });
    
    return parts;
  };
  
  // Parse inline markdown (bold, italic)
  const parseInlineMarkdown = (content: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Pattern to match **bold** or *italic*
    const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = pattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${currentIndex}`}>{content.substring(lastIndex, match.index)}</Text>
        );
        currentIndex++;
      }
      
      // Add the formatted text
      if (match[1].startsWith('**')) {
        // Bold text
        parts.push(
          <Text key={`bold-${currentIndex}`} style={styles.bold}>
            {match[2]}
          </Text>
        );
      } else {
        // Italic text
        parts.push(
          <Text key={`italic-${currentIndex}`} style={styles.italic}>
            {match[3]}
          </Text>
        );
      }
      
      lastIndex = pattern.lastIndex;
      currentIndex++;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${currentIndex}`}>{content.substring(lastIndex)}</Text>
      );
    }
    
    // If no markdown found, return the original text
    if (parts.length === 0) {
      return [<Text key="plain">{content}</Text>];
    }
    
    return parts;
  };
  
  return (
    <View style={[styles.container, style]}>
      {parseMarkdown(text)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.body,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.white,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
  },
  italic: {
    fontStyle: 'italic',
    fontFamily: fonts.body,
    color: colors.white,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  listBullet: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.body,
    color: colors.white,
  },
});

