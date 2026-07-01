import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainerRef } from '@react-navigation/native';
import { store } from './src/store';
import { notificationsApi } from './src/api/notifications.api';
import { RootNavigator } from './src/navigation/RootNavigator';
import { notificationService } from './src/shared/services/notification.service';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import type { MainStackParamList } from './src/navigation/types';

// Map notification data.clickAction → MainStack screen name
const CLICK_ACTION_SCREEN: Record<string, keyof MainStackParamList> = {
  bookings:      'Tabs',
  notifications: 'Notifications',
  boardrooms:    'Tabs',
  dashboard:     'Tabs',
};

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<MainStackParamList>>(null);

  useEffect(() => {
    void notificationService.requestPermissions();

    const receivedSub = notificationService.addNotificationReceivedListener(
      (_notification) => {
        // Foreground: invalidate RTK Query cache so badge + list refresh immediately
        store.dispatch(notificationsApi.util.invalidateTags(['Notification']));
      },
    );

    const responseSub = notificationService.addNotificationResponseListener(
      (response) => {
        // Invalidate cache so the screen the user lands on has fresh data
        store.dispatch(notificationsApi.util.invalidateTags(['Notification']));

        // Deep-link to the relevant screen based on notification type
        const data = response.notification.request.content.data as Record<string, string> | null;
        const clickAction = data?.['clickAction'] ?? 'notifications';
        const screen = CLICK_ACTION_SCREEN[clickAction] ?? 'Notifications';

        try {
          if (screen === 'Tabs') {
            navigationRef.current?.navigate('Tabs');
          } else {
            navigationRef.current?.navigate(screen as 'Notifications' | 'Profile');
          }
        } catch {
          // Navigation not yet ready — user lands on default screen.
        }
      },
    );

    return () => {
      notificationService.removeSubscription(receivedSub);
      notificationService.removeSubscription(responseSub);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <RootNavigator navigationRef={navigationRef} />
      </Provider>
    </ErrorBoundary>
  );
}
