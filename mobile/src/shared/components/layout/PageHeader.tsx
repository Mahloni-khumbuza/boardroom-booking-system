import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../design-system';

interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, rightAction }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing[5],
  },
  text: { flex: 1 },
  title: {
    fontSize:   typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color:      colors.text.primary,
  },
  subtitle: {
    fontSize:  typography.fontSize.sm,
    color:     colors.text.secondary,
    marginTop: spacing[1],
  },
});
