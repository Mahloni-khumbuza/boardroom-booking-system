import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken     = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading       = false;
    },
    clearCredentials(state) {
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.isLoading       = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthLoading } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAccessToken     = (state: RootState) => state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthIsLoading   = (state: RootState) => state.auth.isLoading;
