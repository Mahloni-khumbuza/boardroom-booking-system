import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  // Generic
  Info              = 'info',
  System            = 'system',

  // §12 — Booking lifecycle triggers
  BookingCreated    = 'booking_created',      // Booker: confirmation received/approved
  BookingApprovalRequired = 'booking_approval_required', // Admin/FM: approval request
  BookingApproved   = 'booking_approved',     // Booker: booking confirmed
  BookingRejected   = 'booking_rejected',     // Booker: rejection notice with reason
  BookingCancelled  = 'booking_cancelled',    // Booker + admins: cancellation notice
  BookingUpdated    = 'booking_updated',      // Booker + admins: change summary
  BookingReminder   = 'booking_reminder',     // Booker: reminder before start

  // §12 — Operational triggers
  FacilitiesRequest = 'facilities_request',   // FM: setup or catering required
  RoomBlocked       = 'room_blocked',         // Admins + FM: room unavailable notice
}

@Entity({ name: 'notifications' })
@Index(['recipientId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.Info })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
