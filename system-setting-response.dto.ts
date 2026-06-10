import { ApiProperty } from '@nestjs/swagger';

export class SystemSettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'booking.max_advance_days' })
  key: string;

  @ApiProperty({ nullable: true, example: '30' })
  value: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
