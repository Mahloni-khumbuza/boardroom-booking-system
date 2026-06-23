import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'users' })
export class User {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @AutoMap()
  @Column({ name: 'first_name' })
  firstName: string;

  @AutoMap()
  @Column({ name: 'last_name' })
  lastName: string;

  @AutoMap()
  @Column({ type: 'varchar', name: 'phone_number', nullable: true, length: 30 })
  phoneNumber: string | null;

  @AutoMap()
  @Column({ type: 'varchar', nullable: true, length: 100 })
  department: string | null;

  @AutoMap()
  @Column({ type: 'varchar', name: 'job_title', nullable: true, length: 100 })
  jobTitle: string | null;

  @AutoMap()
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @AutoMap()
  @ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @AutoMap()
  @Column({ type: 'uuid', name: 'role_id', nullable: true })
  roleId: string | null;

  @AutoMap()
  @CreateDateColumn()
  createdAt: Date;

  @AutoMap()
  @UpdateDateColumn()
  updatedAt: Date;
}
