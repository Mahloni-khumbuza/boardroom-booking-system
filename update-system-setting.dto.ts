import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSystemSettingDto } from './create-system-setting.dto';

export class UpdateSystemSettingDto extends PartialType(
  OmitType(CreateSystemSettingDto, ['key'] as const),
) {}
