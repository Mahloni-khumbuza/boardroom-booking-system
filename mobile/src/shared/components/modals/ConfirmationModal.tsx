import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius, typography, shadows, colors } from '../../../design-system';
import { PrimaryButton }   from '../buttons/PrimaryButton';
import { SecondaryButton } from '../buttons/SecondaryButton';
import { DangerButton }    from '../buttons/DangerButton';

interface ConfirmationModalProps {
  visible:         boolean;
  title:           string;
  message:         string;
  confirmLabel?:   string;
  cancelLabel?:    string;
  onConfirm:       () => void;
  onCancel:        () => void;
  isLoading?:      boolean;
  isDangerous?:    boolean;
}

export function ConfirmationModal({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, isLoading = false, isDangerous = false,
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <SecondaryButton label={cancelLabel} onPress={onCancel} style={styles.btn} disabled={isLoading} />
            {isDangerous ? (
              <DangerButton label={confirmLabel} onPress={onConfirm} isLoading={isLoading} style={styles.btn} />
            ) : (
              <PrimaryButton label={confirmLabel} onPress={onConfirm} isLoading={isLoading} style={styles.btn} />
            )}
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
    ...shadows.xl,
  },
  title: {
    fontSize:     typography.fontSize.lg,
    fontWeight:   typography.fontWeight.bold,
    color:        colors.text.primary,
    marginBottom: spacing[3],
  },
  message: {
    fontSize:     typography.fontSize.base,
    color:        colors.text.secondary,
    marginBottom: spacing[6],
    lineHeight:   typography.fontSize.base * typography.lineHeight.normal,
  },
  actions: { flexDirection: 'row', gap: spacing[3] },
  btn:     { flex: 1 },
});
