import type { AppDispatch } from '../../../store';
import { setCredentials, clearCredentials } from '../../../store/slices/auth.slice';
import { setUserProfile, clearUserProfile } from '../../../store/slices/user.slice';
import { authStorageService } from './auth-storage.service';

interface UserProfile {
  id:          string;
  email:       string;
  firstName:   string;
  lastName:    string;
  role:        string;
  phoneNumber: string | null;
  department:  string | null;
  jobTitle:    string | null;
}

export const authService = {
  async persistLogin(dispatch: AppDispatch, token: string, user: UserProfile): Promise<void> {
    await authStorageService.saveToken(token);
    await authStorageService.saveUserProfile(user);
    dispatch(setCredentials({ accessToken: token }));
    dispatch(setUserProfile(user));
  },

  async restoreSession(dispatch: AppDispatch): Promise<boolean> {
    const token   = await authStorageService.getToken();
    const profile = await authStorageService.getUserProfile<UserProfile>();
    if (!token || !profile) return false;
    dispatch(setCredentials({ accessToken: token }));
    dispatch(setUserProfile(profile));
    return true;
  },

  async logout(dispatch: AppDispatch): Promise<void> {
    await authStorageService.clearAll();
    dispatch(clearCredentials());
    dispatch(clearUserProfile());
  },
};
