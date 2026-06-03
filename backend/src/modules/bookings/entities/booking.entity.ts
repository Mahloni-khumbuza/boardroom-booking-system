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
import { Amenity } from '../../amenities/entities/amenity.entity';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export enum MeetingType {
  Internal = 'internal',
  External = 'external',
  Interview = 'interview',
  Training = 'training',
  Board = 'board',
  Other = 'other',
}

@Entity({ name: 'bookings' })
@Index(['boardroomId', 'startTime'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamptz', name: 'end_time' })
  endTime: Date;

  @Column({ type: 'int', name: 'attendee_count', default: 1 })
  attendeeCount: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.Pending,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: MeetingType,
    name: 'meeting_type',
    default: MeetingType.Internal,
  })
  meetingType: MeetingType;

  @Column({ default: false, name: 'requires_catering' })
  requiresCatering: boolean;

  @Column({ type: 'text', name: 'catering_notes', nullable: true })
  cateringNotes: string | null;

  @Column({ default: false, name: 'requires_setup' })
  requiresSetup: boolean;

  @Column({ type: 'text', name: 'setup_notes', nullable: true })
  setupNotes: string | null;

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason: string | null;

  @ManyToOne(() => Boardroom, (boardroom) => boardroom.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boardroom_id' })
  boardroom: Boardroom;

  @Column({ name: 'boardroom_id' })
  boardroomId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booked_by_id' })
  bookedBy: User | null;

  @Column({ type: 'uuid', name: 'booked_by_id', nullable: true })
  bookedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User | null;

  @Column({ type: 'uuid', name: 'approved_by_id', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rejected_by_id' })
  rejectedBy: User | null;

  @Column({ type: 'uuid', name: 'rejected_by_id', nullable: true })
  rejectedById: string | null;

  @ManyToMany(() => Amenity, { eager: true })
  @JoinTable({
    name: 'booking_amenities',
    joinColumn: { name: 'booking_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  requestedAmenities: Amenity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
