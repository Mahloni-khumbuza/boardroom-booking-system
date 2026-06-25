import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ResetPasswordScreenProps } from '../../../navigation/types';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../../shared/utils/validation.utils';
import { useResetPasswordMutation } from '../../../api/auth.api';
import { extractApiError } from '../../../api/error.utils';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { PasswordInput } from '../../../shared/components/inputs/PasswordInput';
import { PrimaryButton } from '../../../shared/components/buttons/PrimaryButton';
import { SuccessModal }  from '../../../shared/components/modals/SuccessModal';
import { ErrorModal }    from '../../../shared/components/modals/ErrorModal';
import { colors, spacing, typography } from '../../../design-system';

export function ResetPasswordScreen({ route, navigation }: ResetPasswordScreenProps) {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword({ token: route.params.token, password: values.password }).unwrap();
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiError(err));
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="New password"
            placeholder="At least 8 characters"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorMessage={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your new password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorMessage={errors.confirmPassword?.message}
          />
        )}
      />

      <PrimaryButton label="Set New Password" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />

      <SuccessModal
        visible={showSuccess}
        title="Password updated"
        message="Your password has been reset successfully. You can now sign in."
        onClose={() => { setShowSuccess(false); navigation.navigate('Login'); }}
      />
      <ErrorModal
        visible={!!errorMessage}
        message={errorMessage ?? ''}
        onClose={() => setErrorMessage(null)}
        onRetry={handleSubmit(onSubmit)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header:   { marginBottom: spacing[8], marginTop: spacing[8] },
  title: {
    fontSize:   typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color:      colors.text.primary,
    marginBottom: spacing[1],
  },
  subtitle: { fontSize: typography.fontSize.base, color: colors.text.secondary },
});
