import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum MeetingType {
  Internal = 'internal',
  External = 'external',
  Hybrid = 'hybrid',
  Training = 'training',
  Interview = 'interview',
  Other = 'other',
}

@Entity({ name: 'bookings' })
@Index(['boardroomId', 'startDateTime'])
export class Booking {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ length: 200 })
  title: string;

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'start_date_time' })
  startDateTime: Date;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'end_date_time' })
  endDateTime: Date;

  @AutoMap()
  @Column({ type: 'int', name: 'attendee_count', default: 1 })
  attendeeCount: number;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_APPROVAL,
  })
  status: BookingStatus;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: MeetingType,
    name: 'meeting_type',
    default: MeetingType.Internal,
  })
  meetingType: MeetingType;

  @AutoMap()
  @Column({ default: false, name: 'requires_catering' })
  requiresCatering: boolean;

  @AutoMap()
  @Column({ nullable: true, type: 'text', name: 'catering_notes' })
  cateringNotes: string | null;

  @AutoMap()
  @Column({ default: false, name: 'requires_setup' })
  requiresSetup: boolean;

  @AutoMap()
  @Column({ nullable: true, type: 'text', name: 'setup_notes' })
  setupNotes: string | null;

  @AutoMap()
  @Column({ nullable: true, type: 'text', name: 'cancellation_reason' })
  cancellationReason: string | null;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;

  @AutoMap()
  @Column({ nullable: true, type: 'text', name: 'rejection_reason' })
  rejectionReason: string | null;

  @AutoMap()
  @ManyToOne(() => Boardroom, (boardroom) => boardroom.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardroom_id' })
  boardroom: Boardroom;

  @AutoMap()
  @Column({ name: 'boardroom_id' })
  boardroomId: string;

  @AutoMap()
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booked_by_user_id' })
  bookedByUser: User | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'booked_by_user_id', nullable: true })
  bookedByUserId: string | null;

  @AutoMap()
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser: User | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'approved_by_user_id', nullable: true })
  approvedByUserId: string | null;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @AutoMap()
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rejected_by_user_id' })
  rejectedByUser: User | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'rejected_by_user_id', nullable: true })
  rejectedByUserId: string | null;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'rejected_at', nullable: true })
  rejectedAt: Date | null;

  @AutoMap()
  @ManyToMany(() => Amenity, { eager: false })
  @JoinTable({
    name: 'booking_amenities',
    joinColumn: { name: 'booking_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  requestedAmenities: Amenity[];

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
