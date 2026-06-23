import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';

@Entity({ name: 'system_settings' })
export class SystemSetting {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ unique: true })
  key: string;

  @AutoMap()
  @Column({ type: 'text', nullable: true })
  value: string | null;

  @AutoMap()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
