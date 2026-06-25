import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, borderWidth } from '../../../design-system';

interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchInput({ value, onClear, style, ...rest }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, focused && styles.focused]}>
      <Ionicons name="search-outline" size={18} color={colors.text.secondary} style={styles.icon} />
      <TextInput
        {...rest}
        value={value}
        style={[styles.input, style]}
        onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
        placeholderTextColor={colors.text.disabled}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={onClear} style={styles.clear}>
          <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  colors.neutral[100],
    borderColor:      colors.neutral[300],
    borderWidth:      borderWidth.sm,
    borderRadius:     borderRadius.full,
    paddingHorizontal: spacing[4],
    minHeight:        44,
  },
  focused: { borderColor: colors.primary[500], backgroundColor: colors.surface },
  icon:    { marginRight: spacing[2] },
  input: {
    flex:     1,
    fontSize: typography.fontSize.base,
    color:    colors.text.primary,
  },
  clear: { paddingLeft: spacing[2] },
});
