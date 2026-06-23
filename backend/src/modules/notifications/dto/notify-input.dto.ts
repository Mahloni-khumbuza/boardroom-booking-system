import { NotificationType } from '../entities/notification.entity';

export interface NotifyInput {
  recipientId: string;
  title: string;
  message: string;
  type?: NotificationType;
}
