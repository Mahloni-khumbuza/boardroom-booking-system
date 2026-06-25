import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginScreenProps } from '../../../navigation/types';
import { loginSchema, type LoginFormValues } from '../../../shared/utils/validation.utils';
import { useAppDispatch } from '../../../store/hooks';
import { useLoginMutation } from '../../../api/auth.api';
import { authService } from '../services/auth.service';
import { extractApiError } from '../../../api/error.utils';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { TextInput }     from '../../../shared/components/inputs/TextInput';
import { PasswordInput } from '../../../shared/components/inputs/PasswordInput';
import { PrimaryButton } from '../../../shared/components/buttons/PrimaryButton';
import { colors, spacing, typography } from '../../../design-system';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [loginError, setLoginError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    try {
      const result = await login(values).unwrap();
      await authService.persistLogin(dispatch, result.accessToken, result.user);
    } catch (err) {
      setLoginError(extractApiError(err));
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Email address"
            placeholder="you@boardroom.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorMessage={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorMessage={errors.password?.message}
          />
        )}
      />

      {loginError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loginError}</Text>
        </View>
      )}

      <PrimaryButton
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
        style={styles.loginBtn}
      />

      <Text
        style={styles.forgotLink}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        Forgot your password?
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header:    { marginBottom: spacing[8], marginTop: spacing[8] },
  title: {
    fontSize:   typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color:      colors.text.primary,
    marginBottom: spacing[1],
  },
  subtitle:  { fontSize: typography.fontSize.base, color: colors.text.secondary },
  errorBanner: {
    backgroundColor: colors.danger.light,
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  errorText: {
    color: colors.danger.dark,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  loginBtn:  { marginTop: spacing[2] },
  forgotLink: {
    marginTop:  spacing[4],
    textAlign:  'center',
    color:      colors.text.link,
    fontSize:   typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
