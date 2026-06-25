import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, borderWidth } from '../../../design-system';

interface PasswordInputProps extends TextInputProps {
  label?:        string;
  errorMessage?: string;
}

export function PasswordInput({ label, errorMessage, style, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasError = !!errorMessage;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, focused && styles.focused, hasError && styles.error]}>
        <TextInput
          {...rest}
          secureTextEntry={!visible}
          style={[styles.input, style]}
          onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
          placeholderTextColor={colors.text.disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.toggle}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { marginBottom: spacing[4] },
  label: {
    fontSize:     typography.fontSize.sm,
    fontWeight:   typography.fontWeight.medium,
    color:        colors.text.primary,
    marginBottom: spacing[1],
  },
  inputRow: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  colors.surface,
    borderColor:      colors.border,
    borderWidth:      borderWidth.sm,
    borderRadius:     borderRadius.md,
    minHeight:        48,
    paddingHorizontal: spacing[4],
  },
  focused:   { borderColor: colors.primary[500] },
  error:     { borderColor: colors.danger.main },
  input: {
    flex:            1,
    fontSize:        typography.fontSize.base,
    color:           colors.text.primary,
    paddingVertical: spacing[3],
  },
  toggle:    { paddingLeft: spacing[2] },
  errorText: { fontSize: typography.fontSize.xs, color: colors.danger.main, marginTop: spacing[1] },
});
