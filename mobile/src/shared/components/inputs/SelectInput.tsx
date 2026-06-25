import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, borderWidth } from '../../../design-system';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

interface SelectInputProps<T = string> {
  label?:        string;
  placeholder?:  string;
  value?:        T;
  options:       SelectOption<T>[];
  onPress:       () => void;
  errorMessage?: string;
  disabled?:     boolean;
}

export function SelectInput<T = string>({ label, placeholder, value, options, onPress, errorMessage, disabled }: SelectInputProps<T>) {
  const selected = options.find((o) => o.value === value);
  const hasError = !!errorMessage;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.control, hasError && styles.error, disabled && styles.disabled]}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? selected.label : (placeholder ?? 'Select...')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
  control: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    backgroundColor:  colors.surface,
    borderColor:      colors.border,
    borderWidth:      borderWidth.sm,
    borderRadius:     borderRadius.md,
    paddingVertical:  spacing[3],
    paddingHorizontal: spacing[4],
    minHeight:        48,
  },
  error:    { borderColor: colors.danger.main },
  disabled: { opacity: 0.5 },
  value: {
    fontSize: typography.fontSize.base,
    color:    colors.text.primary,
    flex:     1,
  },
  placeholder: { color: colors.text.disabled },
  errorText: { fontSize: typography.fontSize.xs, color: colors.danger.main, marginTop: spacing[1] },
});
