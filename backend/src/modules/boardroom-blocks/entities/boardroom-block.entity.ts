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
import { AutoMap } from '@automapper/classes';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'boardroom_blocks' })
@Index(['boardroomId', 'startTime'])
export class BoardroomBlock {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @ManyToOne(() => Boardroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardroom_id' })
  boardroom: Boardroom;

  @AutoMap()
  @Column({ name: 'boardroom_id' })
  boardroomId: string;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime: Date;

  @AutoMap()
  @Column({ type: 'timestamptz', name: 'end_time' })
  endTime: Date;

  @AutoMap()
  @Column()
  reason: string;

  @AutoMap()
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @AutoMap()
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
