import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class PermissionResponseDto {
  @AutoMap()
  @ApiProperty({ example: '8c2d7f3a-1c4b-4ec2-b46c-29f5f0c2c8fa' })
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'bookings:approve' })
  name: string;

  @AutoMap()
  @ApiProperty({ example: 'Approve pending bookings', nullable: true })
  description: string | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
