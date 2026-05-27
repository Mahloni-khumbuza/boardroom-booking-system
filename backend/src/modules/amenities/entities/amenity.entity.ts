import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';

@Entity({ name: 'amenities' })
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon: string | null;

  @ManyToMany(() => Boardroom, (boardroom) => boardroom.amenities)
  boardrooms: Boardroom[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
