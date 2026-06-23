import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { NotificationType } from '../entities/notification.entity';

export class NotificationResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @AutoMap()
  @ApiProperty()
  title: string;

  @AutoMap()
  @ApiProperty()
  message: string;

  @AutoMap()
  @ApiProperty()
  isRead: boolean;

  @AutoMap()
  @ApiProperty()
  recipientId: string;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  unread: number;
}
