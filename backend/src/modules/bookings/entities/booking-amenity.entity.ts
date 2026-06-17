import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { Amenity } from '../../amenities/entities/amenity.entity';

@Entity({ name: 'booking_amenities' })
export class BookingAmenity {
  @PrimaryColumn({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @PrimaryColumn({ name: 'amenity_id', type: 'uuid' })
  amenityId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;

  @CreateDateColumn()
  createdAt: Date;
}
