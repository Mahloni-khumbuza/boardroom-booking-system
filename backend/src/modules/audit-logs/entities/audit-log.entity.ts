import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'audit_logs' })
@Index(['entity', 'entityId'])
export class AuditLog {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column()
  action: string;

  @AutoMap()
  @Column()
  entity: string;

  @AutoMap()
  @Column({ type: 'varchar', length: 64, name: 'entity_id', nullable: true })
  entityId: string | null;

  @AutoMap()
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @AutoMap()
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId: string | null;

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;
}
