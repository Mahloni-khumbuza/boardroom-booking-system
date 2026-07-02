import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../store';
import { notificationsApi } from '../../api/notifications.api';
import { notificationService } from './notification.service';

const DEVICE_ID_KEY = 'bbs.deviceId';

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    // Generate a random UUID-like string
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'unknown';
  }
}

export const pushTokenRegistrationService = {
  async registerOnLogin(): Promise<void> {
    try {
      const [token, deviceId] = await Promise.all([
        notificationService.getPushToken(),
        getOrCreateDeviceId(),
      ]);
      if (!token) return;

      await store.dispatch(
        notificationsApi.endpoints.registerPushToken.initiate({
          token,
          platform: 'expo',
          deviceId,
        }),
      );
    } catch {
      // Non-fatal — user can still use the app without push token registration
    }
  },

  async deregisterOnLogout(): Promise<void> {
    try {
      const token = await notificationService.getPushToken();
      if (!token) return;

      await store.dispatch(
        notificationsApi.endpoints.removePushToken.initiate({ token }),
      );
    } catch {
      // Non-fatal — token will expire naturally
    }
  },
};
