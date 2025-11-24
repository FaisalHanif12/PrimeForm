import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, fonts } from '../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

const AuthInput = forwardRef<TextInput, Props>(({ label, error, secureTextEntry, leftIcon, ...rest }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[styles.inputRow, isFocused && styles.inputFocused, !!error && styles.inputError]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.gold} style={styles.leftIcon} />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          spellCheck={false}
          // Prevent caret jump on Android by ensuring single-line and disabling selection changes from parent updates
          multiline={false}
          underlineColorAndroid="transparent"
          selectionColor={colors.gold}
          caretHidden={false}
          {...(Platform.OS === 'android' ? { importantForAutofill: 'no' } : null)}
          {...(Platform.OS === 'android' && typeof rest.value === 'string'
            ? { selection: { start: (rest.value as string).length, end: (rest.value as string).length } }
            : null)}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setIsSecure(s => !s)}>
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={18} color={colors.gold} />
          </TouchableOpacity>
        ) : null}
      </View>
      {/* Underlay fill behind the TextInput to avoid white placeholder/field background on Android */}
      {/* Kept outside input row to not affect caret */}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

export default AuthInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    color: '#FACC15',
    marginBottom: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputRow: {
    width: '100%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: fonts.body,
    paddingRight: spacing.md,
    minHeight: 16,
    // Avoid Android caret rendering issues caused by textAlignVertical/includeFontPadding on single-line inputs
    textAlign: 'left',
    backgroundColor: 'transparent',
  },
  inputFocused: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  inputError: {
    borderColor: colors.error,
  },
  leftIcon: {
    marginRight: spacing.sm,
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


