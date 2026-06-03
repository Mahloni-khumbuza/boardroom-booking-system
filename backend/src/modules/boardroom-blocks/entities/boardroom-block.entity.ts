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

@Entity({ name: 'boardroom_blocks' })
@Index(['boardroomId', 'startTime'])
export class BoardroomBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Boardroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardroom_id' })
  boardroom: Boardroom;

  @Column({ name: 'boardroom_id' })
  boardroomId: string;

  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamptz', name: 'end_time' })
  endTime: Date;

  @Column()
  reason: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
