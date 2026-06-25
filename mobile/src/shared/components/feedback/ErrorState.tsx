import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../../design-system';
import { SecondaryButton } from '../buttons/SecondaryButton';

interface ErrorStateProps {
  message?:  string;
  onRetry?:  () => void;
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={56} color={colors.danger.main} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <SecondaryButton label="Try Again" onPress={onRetry} />
        </View>
      ) : null}
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
  },
  message: {
    marginTop: spacing[2],
    fontSize:  typography.fontSize.base,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  action: { marginTop: spacing[6] },
});
