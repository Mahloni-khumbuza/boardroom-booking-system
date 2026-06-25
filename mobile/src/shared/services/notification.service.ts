import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: existing } = await ExpoNotifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getPushToken(): Promise<string | null> {
    const hasPermission = await notificationService.requestPermissions();
    if (!hasPermission) return null;

    if (Platform.OS === 'android') {
      await ExpoNotifications.setNotificationChannelAsync('default', {
        name:      'Default',
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A5F',
      });
    }

    try {
      const token = await ExpoNotifications.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  },

  scheduleLocalNotification(title: string, body: string, delaySeconds = 0): void {
    void ExpoNotifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: delaySeconds > 0 ? { type: ExpoNotifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds } : null,
    });
  },

  addNotificationReceivedListener(
    handler: (notification: ExpoNotifications.Notification) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationReceivedListener(handler);
  },

  addNotificationResponseListener(
    handler: (response: ExpoNotifications.NotificationResponse) => void,
  ): ExpoNotifications.EventSubscription {
    return ExpoNotifications.addNotificationResponseReceivedListener(handler);
  },

  removeSubscription(subscription: ExpoNotifications.EventSubscription): void {
    subscription.remove();
  },
};
