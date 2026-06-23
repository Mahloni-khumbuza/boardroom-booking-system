import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum EquipmentStatus {
  Ok = 'ok',
  NeedsAttention = 'needs_attention',
  OutOfService = 'out_of_service',
}

@Entity({ name: 'boardrooms' })
export class Boardroom {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ unique: true, length: 80 })
  name: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  code: string | null;

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @AutoMap()
  @Column({ type: 'int' })
  capacity: number;

  @AutoMap()
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @AutoMap()
  @Column({ type: 'varchar', length: 50, nullable: true })
  floor: string | null;

  @AutoMap()
  @Column({ type: 'varchar', length: 100, nullable: true })
  building: string | null;

  @AutoMap()
  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl: string | null;

  @AutoMap()
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @AutoMap()
  @Column({ default: true, name: 'is_bookable' })
  isBookable: boolean;

  @AutoMap()
  @Column({ default: false, name: 'requires_approval' })
  requiresApproval: boolean;

  @AutoMap()
  @Column({ type: 'varchar', length: 5, name: 'opening_time', default: '08:00' })
  openingTime: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 5, name: 'closing_time', default: '18:00' })
  closingTime: string;

  @AutoMap()
  @Column({ type: 'int', name: 'minimum_booking_minutes', default: 15 })
  minimumBookingMinutes: number;

  @AutoMap()
  @Column({ type: 'int', name: 'maximum_booking_minutes', default: 480 })
  maximumBookingMinutes: number;

  @AutoMap()
  @Column({ type: 'int', name: 'buffer_time_before_minutes', default: 0 })
  bufferTimeBeforeMinutes: number;

  @AutoMap()
  @Column({ type: 'int', name: 'buffer_time_after_minutes', default: 0 })
  bufferTimeAfterMinutes: number;

  @AutoMap()
  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    name: 'equipment_status',
    default: EquipmentStatus.Ok,
  })
  equipmentStatus: EquipmentStatus;

  @AutoMap()
  @ManyToMany(() => Amenity, (amenity) => amenity.boardrooms, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: 'boardroom_amenities',
    joinColumn: { name: 'boardroom_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  amenities: Amenity[];

  @OneToMany(() => Booking, (booking) => booking.boardroom)
  bookings: Booking[];

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
