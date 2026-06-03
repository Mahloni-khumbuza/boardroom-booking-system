import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { PaginatedAuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AuditLogsService } from '../services/audit-logs.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @Permissions('audit-logs:read')
  @ApiOperation({ summary: 'List audit log entries', operationId: 'listAuditLogs' })
  @ApiOkResponse({ type: PaginatedAuditLogResponseDto })
  async findAll(@Query() query: AuditLogQueryDto): Promise<PaginatedAuditLogResponseDto> {
    const result = await this.service.findAll(query);
    return {
      ...result,
      items: result.items.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata,
        actor: entry.actor
          ? {
              id: entry.actor.id,
              email: entry.actor.email,
              firstName: entry.actor.firstName,
              lastName: entry.actor.lastName,
            }
          : null,
        createdAt: entry.createdAt,
      })),
    };
  }
}
