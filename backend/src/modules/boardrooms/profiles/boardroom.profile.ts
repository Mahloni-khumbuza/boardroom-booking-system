import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { Boardroom } from '../entities/boardroom.entity';
import { BoardroomResponseDto } from '../dto/boardroom-response.dto';

@Injectable()
export class BoardroomProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(Boardroom, BoardroomResponseDto);
    };
  }
}
