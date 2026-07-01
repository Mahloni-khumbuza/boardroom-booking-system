import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { SystemSetting } from '../entities/system-setting.entity';
import { SystemSettingResponseDto } from '../dto/system-setting-response.dto';

@Injectable()
export class SystemSettingProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(SystemSetting, SystemSettingResponseDto);
    };
  }
}
