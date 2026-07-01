import { apiSlice } from './api.slice';

export type NotificationType =
  | 'info'
  | 'system'
  | 'booking_created'
  | 'booking_approval_required'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_updated'
  | 'booking_reminder'
  | 'facilities_request'
  | 'room_blocked';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  recipientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  unread: number;
}

export interface RegisterTokenRequest {
  token: string;
  platform: 'expo' | 'fcm' | 'apns' | 'web';
  deviceId?: string;
}

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<Notification[], void>({
      query: () => 'notifications',
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => 'notifications/unread-count',
      providesTags: ['Notification'],
    }),

    markRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllRead: builder.mutation<{ updated: number }, void>({
      query: () => ({
        url: 'notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    registerPushToken: builder.mutation<{ id: string }, RegisterTokenRequest>({
      query: (body) => ({
        url: 'push-tokens',
        method: 'POST',
        body,
      }),
    }),

    removePushToken: builder.mutation<void, { token: string }>({
      query: (body) => ({
        url: 'push-tokens',
        method: 'DELETE',
        body,
      }),
    }),

    removeAllPushTokens: builder.mutation<void, void>({
      query: () => ({
        url: 'push-tokens/all',
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useRegisterPushTokenMutation,
  useRemovePushTokenMutation,
  useRemoveAllPushTokensMutation,
} = notificationsApi;
