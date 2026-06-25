import { apiSlice } from './api.slice';

interface LoginRequest {
  email:    string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id:          string;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        string;
    phoneNumber: string | null;
    department:  string | null;
    jobTitle:    string | null;
  };
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token:    string;
  password: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url:    'auth/login',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({
        url:    'auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({
        url:    'auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    getProfile: builder.query<LoginResponse['user'], void>({
      query: () => 'auth/profile',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
} = authApi;
