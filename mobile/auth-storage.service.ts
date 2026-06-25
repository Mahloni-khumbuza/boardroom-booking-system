import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'boardroom:access_token';
const USER_KEY  = 'boardroom:user_profile';

export const authStorageService = {
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async saveUserProfile(profile: object): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
  },

  async getUserProfile<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async removeUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};
