import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../../design-system';

interface EmptyStateProps {
  title:       string;
  message?:    string;
  icon?:       keyof typeof Ionicons.glyphMap;
  action?:     React.ReactNode;
}

export function EmptyState({ title, message, icon = 'folder-open-outline', action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.neutral[400]} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing[8],
  },
  title: {
    marginTop:  spacing[4],
    fontSize:   typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color:      colors.text.primary,
    textAlign:  'center',
  },
  message: {
    marginTop: spacing[2],
    fontSize:  typography.fontSize.base,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  action: { marginTop: spacing[6] },
});
