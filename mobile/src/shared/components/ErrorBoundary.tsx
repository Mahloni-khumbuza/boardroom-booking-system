import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../design-system';
import { SecondaryButton } from './buttons/SecondaryButton';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, message };
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.message}</Text>
          <SecondaryButton label="Try Again" onPress={this.handleReset} style={styles.btn} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing[6],
    backgroundColor: colors.background,
  },
  title: {
    fontSize:     typography.fontSize.xl,
    fontWeight:   typography.fontWeight.bold,
    color:        colors.text.primary,
    marginBottom: spacing[3],
    textAlign:    'center',
  },
  message: {
    fontSize:     typography.fontSize.base,
    color:        colors.text.secondary,
    textAlign:    'center',
    marginBottom: spacing[6],
  },
  btn: { minWidth: 160 },
});
