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

// Notification + push token hooks (injected via notifications.api.ts)
export {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
  useRemoveAllPushTokensMutation,
} from './notifications.api';
export type { Notification, NotificationType, RegisterTokenRequest } from './notifications.api';
