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
import { Amenity } from '../../amenities/entities/amenity.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity({ name: 'boardrooms' })
export class Boardroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
