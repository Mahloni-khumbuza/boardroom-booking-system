import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { Permission } from '../entities/permission.entity';
import { PermissionResponseDto } from '../dto/permission-response.dto';

@Injectable()
export class PermissionProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(Permission, PermissionResponseDto);
    };
  }
}
