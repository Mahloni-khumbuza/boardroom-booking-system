import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../design-system';

interface DangerButtonProps extends TouchableOpacityProps {
  label:      string;
  isLoading?: boolean;
}

export function DangerButton({ label, isLoading = false, disabled, style, ...rest }: DangerButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <TouchableOpacity
      {...rest}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.inverse} size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor:  colors.danger.main,
    paddingVertical:  spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius:     borderRadius.md,
    alignItems:       'center',
    justifyContent:   'center',
    minHeight:        48,
  },
  disabled: { opacity: 0.5 },
  label: {
    color:       colors.text.inverse,
    fontSize:    typography.fontSize.base,
    fontWeight:  typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
});
