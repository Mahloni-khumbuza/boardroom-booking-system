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
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
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

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.Pending,
  })
  status: BookingStatus;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
