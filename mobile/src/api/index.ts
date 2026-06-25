// API layer public surface
//
// RULE: Screens and components MUST import API hooks and utilities from this
// barrel (or from a feature's own api file) — never directly from api.slice.ts.

export { apiSlice } from './api.slice';
export { extractApiError } from './error.utils';

// Auth endpoint hooks (injected via auth.api.ts)
export {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
} from './auth.api';
