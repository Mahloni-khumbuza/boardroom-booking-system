import React from 'react';
import { TouchableOpacity, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { colors, spacing, borderRadius } from '../../../design-system';

interface IconButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  size?:    number;
  variant?: 'default' | 'ghost';
}

export function IconButton({ children, size = 40, variant = 'default', disabled, style, ...rest }: IconButtonProps) {
  return (
    <TouchableOpacity
      {...rest}
      disabled={disabled}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral[100],
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing[1],
  },
  ghost:   { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
});
