import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectAuthIsLoading, setAuthLoading } from '../store/slices/auth.slice';
import { authService } from '../features/auth/services/auth.service';
import { AuthStack } from './AuthStack';
import { MainTabs }  from './MainTabs';
import { LoadingState } from '../shared/components/feedback/LoadingState';

const linking = {
  prefixes: ['boardroom://', 'exp://localhost:8081'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export function RootNavigator() {
  const dispatch         = useAppDispatch();
  const isAuthenticated  = useAppSelector(selectIsAuthenticated);
  const isLoading        = useAppSelector(selectAuthIsLoading);

  useEffect(() => {
    authService.restoreSession(dispatch).finally(() => {
      dispatch(setAuthLoading(false));
    });
  }, [dispatch]);

  if (isLoading) return <LoadingState message="Restoring session..." />;

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
