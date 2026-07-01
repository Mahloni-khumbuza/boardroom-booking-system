import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { UserProfile } from '../../shared/types/user.types';

interface UserState {
  profile: UserProfile | null;
}

const initialState: UserState = {
  profile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
    },
    clearUserProfile(state) {
      state.profile = null;
    },
  },
});

export const { setUserProfile, clearUserProfile } = userSlice.actions;
export const userReducer = userSlice.reducer;

export const selectUserProfile  = (state: RootState) => state.user.profile;
export const selectUserFullName = (state: RootState) =>
  state.user.profile
    ? `${state.user.profile.firstName} ${state.user.profile.lastName}`
    : null;
