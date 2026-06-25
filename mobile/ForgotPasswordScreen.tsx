import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ForgotPasswordScreenProps } from '../../../navigation/types';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../../shared/utils/validation.utils';
import { useForgotPasswordMutation } from '../../../api/auth.api';
import { extractApiError } from '../../../api/error.utils';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { TextInput }     from '../../../shared/components/inputs/TextInput';
import { PrimaryButton } from '../../../shared/components/buttons/PrimaryButton';
import { SuccessModal }  from '../../../shared/components/modals/SuccessModal';
import { ErrorModal }    from '../../../shared/components/modals/ErrorModal';
import { colors, spacing, typography } from '../../../design-system';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values).unwrap();
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiError(err));
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Enter your email and we will send you a reset link.</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Email address"
            placeholder="you@equisoft.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorMessage={errors.email?.message}
          />
        )}
      />

      <PrimaryButton label="Send Reset Link" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />

      <Text style={styles.backLink} onPress={() => navigation.goBack()}>
        Back to Sign In
      </Text>

      <SuccessModal
        visible={showSuccess}
        title="Email sent"
        message="Check your inbox for a password reset link."
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
  backLink: {
    marginTop: spacing[4],
    textAlign: 'center',
    color:     colors.text.link,
    fontSize:  typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
