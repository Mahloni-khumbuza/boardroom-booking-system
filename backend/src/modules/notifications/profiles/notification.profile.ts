import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { Mapper, MappingProfile } from '@automapper/core';
import { Notification } from '../entities/notification.entity';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@Injectable()
export class NotificationProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper.createMap(Notification, NotificationResponseDto);
    };
  }
}
