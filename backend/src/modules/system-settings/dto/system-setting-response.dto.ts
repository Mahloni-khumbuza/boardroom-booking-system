import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class SystemSettingResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'booking.max_advance_days' })
  key: string;

  @AutoMap()
  @ApiProperty({ nullable: true, example: '30' })
  value: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true })
  description: string | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;

  @AutoMap()
  @ApiProperty()
  updatedAt: Date;
}
