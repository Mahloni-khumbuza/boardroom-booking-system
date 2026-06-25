import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './slices/auth.slice';
import { userReducer } from './slices/user.slice';
import { apiSlice } from '../api/api.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
