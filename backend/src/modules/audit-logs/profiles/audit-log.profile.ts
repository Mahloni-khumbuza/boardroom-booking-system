import { Injectable, Inject } from '@nestjs/common';
import { AutomapperProfile } from '@automapper/nestjs';
import { mapFrom } from '@automapper/core';
import { Mapper, MappingProfile } from '@automapper/core';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogActorDto, AuditLogResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class AuditLogProfile extends AutomapperProfile {
  constructor(@Inject('automapper:nestjs:default') mapper: any) {
    super(mapper as Mapper);
  }

  mapProfile(): MappingProfile {
    return (mapper) => {
      mapper
        .createMap(AuditLog, AuditLogResponseDto)
        .forMember(
          (d) => d.actor,
          mapFrom((s) =>
            s.actor
              ? Object.assign(new AuditLogActorDto(), {
                  id: s.actor.id,
                  email: s.actor.email,
                  firstName: s.actor.firstName,
                  lastName: s.actor.lastName,
                })
              : null,
          ),
        );
    };
  }
}
