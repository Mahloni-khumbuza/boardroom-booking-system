import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { Amenity } from '../entities/amenity.entity';
import { AmenityResponseDto } from '../dto/amenity-response.dto';

@Injectable()
export class AmenityProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(Amenity, AmenityResponseDto);
    };
  }
}
