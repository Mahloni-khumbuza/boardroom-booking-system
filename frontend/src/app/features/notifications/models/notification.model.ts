export type NotificationType =
  | 'info'
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'system'
  | 'setup'
  | 'catering'
  | 'maintenance';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  recipientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreateRequest {
  title: string;
  message: string;
  recipientId: string;
  type?: NotificationType;
}

export interface UnreadCount {
  unread: number;
}
