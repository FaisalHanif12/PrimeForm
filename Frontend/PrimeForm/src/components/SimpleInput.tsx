import React, { forwardRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Text } from 'react-native';
import { colors, radius, spacing, typography, fonts } from '../theme/colors';

type Props = TextInputProps & {
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: string;
};

const SimpleInput = forwardRef<TextInput, Props>(({ left, right, style, error, ...rest }, ref) => {
  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, !!error && styles.inputError]}>
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
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

export default SimpleInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  inputRow: {
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
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: fonts.body,
    paddingRight: spacing.md,
    backgroundColor: 'transparent',
    textAlign: 'left',
    minHeight: 16,
  },
  error: {
    marginTop: -spacing.md + spacing.xs,
    marginBottom: spacing.sm,
    color: colors.error,
    fontSize: typography.small,
    fontFamily: fonts.body,
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
});


