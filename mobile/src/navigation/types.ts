import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps }   from '@react-navigation/bottom-tabs';

// Auth stack
export type AuthStackParamList = {
  Login:         undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main tab navigator
export type MainTabParamList = {
  Dashboard:     undefined;
  Boardrooms:    undefined;
  Bookings:      undefined;
  Notifications: undefined;
  Profile:       undefined;
};

// Screen prop helpers
export type LoginScreenProps         = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type ResetPasswordScreenProps  = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export type DashboardScreenProps     = BottomTabScreenProps<MainTabParamList, 'Dashboard'>;
export type BoardroomsScreenProps    = BottomTabScreenProps<MainTabParamList, 'Boardrooms'>;
export type BookingsScreenProps      = BottomTabScreenProps<MainTabParamList, 'Bookings'>;
export type NotificationsScreenProps = BottomTabScreenProps<MainTabParamList, 'Notifications'>;
export type ProfileScreenProps       = BottomTabScreenProps<MainTabParamList, 'Profile'>;
