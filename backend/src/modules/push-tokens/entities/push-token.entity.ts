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
import { User } from '../../users/entities/user.entity';

export enum PushTokenPlatform {
  Expo    = 'expo',
  FCM     = 'fcm',
  APNS    = 'apns',
  Web     = 'web',
}

@Entity({ name: 'push_tokens' })
@Index(['userId', 'token'], { unique: true })
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 512 })
  token: string;

  @Column({ type: 'enum', enum: PushTokenPlatform, default: PushTokenPlatform.Expo })
  platform: PushTokenPlatform;

  @Column({ type: 'varchar', name: 'device_id', length: 256, nullable: true })
  deviceId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
