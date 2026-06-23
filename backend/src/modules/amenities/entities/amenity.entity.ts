import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';

@Entity({ name: 'amenities' })
export class Amenity {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ unique: true })
  name: string;

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @AutoMap()
  @Column({ type: 'varchar', length: 64, nullable: true })
  icon: string | null;

  @ManyToMany(() => Boardroom, (boardroom) => boardroom.amenities)
  boardrooms: Boardroom[];

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
