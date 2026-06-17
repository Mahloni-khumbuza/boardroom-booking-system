import { ApiProperty } from '@nestjs/swagger';
import { SystemSetting } from '../entities/system-setting.entity';

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

  static fromEntity(setting: SystemSetting): SystemSettingResponseDto {
    const dto = new SystemSettingResponseDto();
    dto.id = setting.id;
    dto.key = setting.key;
    dto.value = setting.value;
    dto.description = setting.description;
    dto.createdAt = setting.createdAt;
    dto.updatedAt = setting.updatedAt;
    return dto;
  }

  static collection(settings: SystemSetting[]): SystemSettingResponseDto[] {
    return settings.map(SystemSettingResponseDto.fromEntity);
  }
}
