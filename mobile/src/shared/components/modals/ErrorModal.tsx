import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../../design-system';
import { PrimaryButton }   from '../buttons/PrimaryButton';
import { SecondaryButton } from '../buttons/SecondaryButton';

interface ErrorModalProps {
  visible:      boolean;
  title?:       string;
  message:      string;
  onClose:      () => void;
  onRetry?:     () => void;
}

export function ErrorModal({ visible, title = 'Something went wrong', message, onClose, onRetry }: ErrorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={56} color={colors.danger.main} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <SecondaryButton label="Dismiss" onPress={onClose} style={styles.btn} />
            {onRetry ? <PrimaryButton label="Retry" onPress={onRetry} style={styles.btn} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing[6],
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing[6],
    width:           '100%',
    alignItems:      'center',
    ...shadows.xl,
  },
  iconWrap:  { marginBottom: spacing[4] },
  title: {
    fontSize:     typography.fontSize.xl,
    fontWeight:   typography.fontWeight.bold,
    color:        colors.text.primary,
    marginBottom: spacing[2],
    textAlign:    'center',
  },
  message: {
    fontSize:     typography.fontSize.base,
    color:        colors.text.secondary,
    marginBottom: spacing[6],
    textAlign:    'center',
    lineHeight:   typography.fontSize.base * typography.lineHeight.normal,
  },
  actions: { flexDirection: 'row', gap: spacing[3], width: '100%' },
  btn:     { flex: 1 },
});
