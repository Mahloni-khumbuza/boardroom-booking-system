import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { Role } from '../entities/role.entity';
import { RoleResponseDto } from '../dto/role-response.dto';

@Injectable()
export class RoleProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(Role, RoleResponseDto);
    };
  }
}
