import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class AuditLogActorDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty()
  email: string;

  @AutoMap()
  @ApiProperty()
  firstName: string;

  @AutoMap()
  @ApiProperty()
  lastName: string;
}

export class AuditLogResponseDto {
  @AutoMap()
  @ApiProperty()
  id: string;

  @AutoMap()
  @ApiProperty({ example: 'user.created' })
  action: string;

  @AutoMap()
  @ApiProperty({ example: 'user' })
  entity: string;

  @AutoMap()
  @ApiProperty({ nullable: true })
  entityId: string | null;

  @AutoMap()
  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  metadata: Record<string, unknown> | null;

  @AutoMap()
  @ApiProperty({ nullable: true, type: AuditLogActorDto })
  actor: AuditLogActorDto | null;

  @AutoMap()
  @ApiProperty()
  createdAt: Date;
}

export class PaginatedAuditLogResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
