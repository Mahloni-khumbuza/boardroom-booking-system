import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography, borderWidth } from '../../../design-system';

interface SecondaryButtonProps extends TouchableOpacityProps {
  label:      string;
  isLoading?: boolean;
}

export function SecondaryButton({ label, isLoading = false, disabled, style, ...rest }: SecondaryButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <TouchableOpacity
      {...rest}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary[500]} size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor:  'transparent',
    borderColor:      colors.primary[500],
    borderWidth:      borderWidth.sm,
    paddingVertical:  spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius:     borderRadius.md,
    alignItems:       'center',
    justifyContent:   'center',
    minHeight:        48,
  },
  disabled: { opacity: 0.5 },
  label: {
    color:       colors.primary[500],
    fontSize:    typography.fontSize.base,
    fontWeight:  typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
});
