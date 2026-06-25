type AppEnv = 'development' | 'staging' | 'production';

const rawApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const rawAppEnv = process.env.EXPO_PUBLIC_APP_ENV;

if (!rawApiUrl) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env and fill in the values.');
}

const validEnvs: AppEnv[] = ['development', 'staging', 'production'];
const appEnv: AppEnv = validEnvs.includes(rawAppEnv as AppEnv)
  ? (rawAppEnv as AppEnv)
  : 'development';

export const config = {
  apiBaseUrl:    rawApiUrl,
  appEnv,
  isDevelopment: appEnv === 'development',
  isStaging:     appEnv === 'staging',
  isProduction:  appEnv === 'production',
} as const;
