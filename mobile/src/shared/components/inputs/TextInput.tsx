import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { colors, spacing, borderRadius, typography, borderWidth } from '../../../design-system';

interface AppTextInputProps extends TextInputProps {
  label?:       string;
  errorMessage?: string;
  hint?:        string;
}

export function TextInput({ label, errorMessage, hint, style, ...rest }: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!errorMessage;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        {...rest}
        style={[
          styles.input,
          focused && styles.focused,
          hasError && styles.error,
          style,
        ]}
        onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
        placeholderTextColor={colors.text.disabled}
      />
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {hint && !hasError ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing[4] },
  label: {
    fontSize:     typography.fontSize.sm,
    fontWeight:   typography.fontWeight.medium,
    color:        colors.text.primary,
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor:  colors.surface,
    borderColor:      colors.border,
    borderWidth:      borderWidth.sm,
    borderRadius:     borderRadius.md,
    paddingVertical:  spacing[3],
    paddingHorizontal: spacing[4],
    fontSize:         typography.fontSize.base,
    color:            colors.text.primary,
    minHeight:        48,
  },
  focused:   { borderColor: colors.primary[500] },
  error:     { borderColor: colors.danger.main },
  errorText: { fontSize: typography.fontSize.xs, color: colors.danger.main, marginTop: spacing[1] },
  hint:      { fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: spacing[1] },
});
