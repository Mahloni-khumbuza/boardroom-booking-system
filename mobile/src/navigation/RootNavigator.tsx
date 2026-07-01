import React, { useEffect, RefObject } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectAuthIsLoading, setAuthLoading } from '../store/slices/auth.slice';
import { authService } from '../features/auth/services/auth.service';
import { AuthStack } from './AuthStack';
import { MainTabs }  from './MainTabs';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { ProfileScreen }       from '../features/profile/screens/ProfileScreen';
import { LoadingState } from '../shared/components/feedback/LoadingState';
import type { MainStackParamList } from './types';
import { colors, typography } from '../design-system';

const MainStack = createNativeStackNavigator<MainStackParamList>();

const linking = {
  prefixes: ['boardroom://', 'exp://localhost:8081'],
  config: {
    screens: {
      Tabs: '',
      Notifications: 'notifications',
      Profile: 'profile',
    } as Record<keyof MainStackParamList, string>,
  },
};

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: colors.surface },
        headerTintColor:  colors.text.primary,
        headerTitleStyle: {
          fontSize:   typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
      }}
    >
      <MainStack.Screen name="Tabs"          component={MainTabs}           options={{ headerShown: false }} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <MainStack.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Profile' }} />
    </MainStack.Navigator>
  );
}

interface RootNavigatorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigationRef?: RefObject<any>;
}

export function RootNavigator({ navigationRef }: RootNavigatorProps) {
  const dispatch        = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading       = useAppSelector(selectAuthIsLoading);

  useEffect(() => {
    authService.restoreSession(dispatch).finally(() => {
      dispatch(setAuthLoading(false));
    });
  }, [dispatch]);

  if (isLoading) return <LoadingState message="Restoring session..." />;

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      {isAuthenticated ? <MainNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
