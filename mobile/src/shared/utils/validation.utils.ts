import { z } from 'zod';

export const emailSchema = z
  .string({ error: 'Email is required.' })
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.');

export const passwordSchema = z
  .string({ error: 'Password is required.' })
  .min(8,  'Password must be at least 8 characters.')
  .max(128, 'Password must not exceed 128 characters.');

export const requiredStringSchema = (fieldName: string) =>
  z.string({ error: `${fieldName} is required.` }).min(1, `${fieldName} is required.`);

export const optionalStringSchema = z.string().optional();

export const loginSchema = z.object({
  email:    emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password:        passwordSchema,
    confirmPassword: z.string({ error: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path:    ['confirmPassword'],
  });

export type LoginFormValues          = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues  = z.infer<typeof resetPasswordSchema>;
