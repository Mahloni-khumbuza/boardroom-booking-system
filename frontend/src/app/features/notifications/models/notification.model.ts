// Mirror of backend NotificationType enum — §12 triggers
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

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info:                      'Info',
  system:                    'System',
  booking_created:           'Booking Created',
  booking_approval_required: 'Approval Required',
  booking_approved:          'Booking Approved',
  booking_rejected:          'Booking Rejected',
  booking_cancelled:         'Booking Cancelled',
  booking_updated:           'Booking Updated',
  booking_reminder:          'Reminder',
  facilities_request:        'Facilities Request',
  room_blocked:              'Room Blocked',
};

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
