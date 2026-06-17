import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Boardroom } from './boardroom.entity';
import { Amenity } from '../../amenities/entities/amenity.entity';

@Entity({ name: 'boardroom_amenities' })
export class BoardroomAmenity {
  @PrimaryColumn({ name: 'boardroom_id', type: 'uuid' })
  boardroomId: string;

  @PrimaryColumn({ name: 'amenity_id', type: 'uuid' })
  amenityId: string;

  @ManyToOne(() => Boardroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardroom_id' })
  boardroom: Boardroom;

  @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;

  @CreateDateColumn()
  createdAt: Date;
}
