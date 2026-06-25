import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../../../design-system';

interface SectionCardProps {
  children:  React.ReactNode;
  title?:    string;
  style?:    ViewStyle;
}

export function SectionCard({ children, title, style }: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing[4],
    marginBottom:    spacing[4],
    ...shadows.sm,
  },
  title: {
    fontSize:     typography.fontSize.base,
    fontWeight:   typography.fontWeight.semibold,
    color:        colors.text.primary,
    marginBottom: spacing[3],
  },
});
