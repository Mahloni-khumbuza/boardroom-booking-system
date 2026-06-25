import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../../design-system';

interface ScreenContainerProps {
  children:     React.ReactNode;
  scrollable?:  boolean;
  style?:       ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({ children, scrollable = true, style, contentStyle }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing[5] },
});
