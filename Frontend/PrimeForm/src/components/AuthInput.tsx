import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

export default function AuthInput({ label, error, secureTextEntry, leftIcon, ...rest }: Props) {
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
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          autoCorrect={false}
          importantForAutofill="yes"
          autoCapitalize="none"
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setIsSecure(s => !s)}>
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={18} color={colors.gold} />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    color: '#FACC15',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingRight: spacing.md,
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
    marginTop: spacing.xs,
    color: colors.error,
    fontSize: typography.small,
  },
});


