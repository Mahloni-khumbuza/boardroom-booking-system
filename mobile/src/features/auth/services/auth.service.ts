import type { AppDispatch } from '../../../store';
import { setCredentials, clearCredentials } from '../../../store/slices/auth.slice';
import { setUserProfile, clearUserProfile } from '../../../store/slices/user.slice';
import type { UserProfile } from '../../../shared/types/user.types';
import { authStorageService } from './auth-storage.service';
import { pushTokenRegistrationService } from '../../../shared/services/push-token-registration.service';

export const authService = {
  async persistLogin(dispatch: AppDispatch, token: string, user: UserProfile): Promise<void> {
    await authStorageService.saveToken(token);
    await authStorageService.saveUserProfile(user);
    dispatch(setCredentials({ accessToken: token }));
    dispatch(setUserProfile(user));
    void pushTokenRegistrationService.registerOnLogin();
  },

  async restoreSession(dispatch: AppDispatch): Promise<boolean> {
    const token   = await authStorageService.getToken();
    const profile = await authStorageService.getUserProfile<UserProfile>();
    if (!token || !profile) return false;
    dispatch(setCredentials({ accessToken: token }));
    dispatch(setUserProfile(profile));
    void pushTokenRegistrationService.registerOnLogin();
    return true;
  },

  async logout(dispatch: AppDispatch): Promise<void> {
    await pushTokenRegistrationService.deregisterOnLogout();
    await authStorageService.clearAll();
    dispatch(clearCredentials());
    dispatch(clearUserProfile());
  },
};
