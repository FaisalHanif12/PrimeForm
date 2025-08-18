import React, { forwardRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = TextInputProps & {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

const SimpleInput = forwardRef<TextInput, Props>(({ left, right, style, ...rest }, ref) => {
  return (
    <View style={styles.container}>
      {left}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={colors.mutedText}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        underlineColorAndroid="transparent"
        multiline={false}
        selectionColor={colors.gold}
        caretHidden={false}
        // Keep the field visually dark; text is white
        {...rest}
      />
      {right}
    </View>
  );
});

export default SimpleInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 36,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingRight: spacing.md,
    backgroundColor: 'transparent',
    textAlign: 'left',
    minHeight: 16,
  },
});


